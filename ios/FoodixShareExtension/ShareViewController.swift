import UIKit
import Social
import Foundation
import UserNotifications
import UniformTypeIdentifiers

final class ShareViewController: SLComposeServiceViewController {
    
    private let appGroupIdentifier = "group.com.foodix.app"
    private let sharedUserDefaults = UserDefaults(suiteName: "group.com.foodix.app")
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("🚀 [ShareExtension] ==========================================")
        print("🚀 [ShareExtension] ShareViewController initialisé !")
        print("🚀 [ShareExtension] App Group: \(appGroupIdentifier)")
        print("🚀 [ShareExtension] ==========================================")
        
        // Interface complètement invisible
        self.view.alpha = 0.01
        self.preferredContentSize = CGSize(width: 1, height: 1)
        
        // Traitement immédiat et invisible
        processSharedContent()
    }
    
    override func isContentValid() -> Bool {
        return true
    }
    
    override func configurationItems() -> [Any]! {
        return []
    }
    
    override func didSelectPost() {
        processSharedContent()
    }
    
    
    private func processSharedContent() {
        print("🚀 [ShareExtension] ==========================================")
        print("🚀 [ShareExtension] Traitement du contenu partagé...")
        print("🚀 [ShareExtension] ==========================================")

        // 1) Récupérer l'URL (public.url OU texte)
        extractURL { [weak self] url in
            if let url = url {
                print("✅ [ShareExtension] ==========================================")
                print("✅ [ShareExtension] URL extraite: \(url.absoluteString)")
                print("✅ [ShareExtension] ==========================================")

                // 2) Créer un job en arrière-plan ET ouvrir Foodix
                self?.createBackgroundJob(url: url.absoluteString)
                self?.openFoodixWithURL(url: url.absoluteString)
            } else {
                print("⚠️ [ShareExtension] ==========================================")
                print("⚠️ [ShareExtension] Aucune URL valide trouvée")
                print("⚠️ [ShareExtension] ==========================================")
            }

            // 3) Terminer immédiatement
            DispatchQueue.main.async {
                print("🏁 [ShareExtension] Fermeture de l'extension...")
                self?.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
            }
        }
    }
    
    private func createBackgroundJob(url: String) {
        print("🔄 [ShareExtension] Création du job en arrière-plan...")
        
        // 1) Créer le payload JSON pour l'endpoint jobs
        let payload: [String: Any] = [
            "source_url": url,
            "user_id": "user_\(UUID().uuidString)",
            "device_token": "device_\(UUID().uuidString)",
            "idempotency_key": "\(url.hashValue)_\(Date().timeIntervalSince1970)",
            "platform": "instagram",
            "author": "Instagram User",
            "caption": "Caption extraite automatiquement",
            "thumbnail": NSNull()
        ]
        
        // 2) Écrire dans l'App Group
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
            print("❌ [ShareExtension] Erreur création App Group")
            return
        }
        
        let file = container.appendingPathComponent("job-\(UUID().uuidString).json")
        do {
            try data.write(to: file, options: .atomic)
            print("✅ [ShareExtension] Job créé: \(file.lastPathComponent)")
        } catch {
            print("❌ [ShareExtension] Erreur écriture fichier: \(error)")
            return
        }
        
        // 3) Lancer l'upload en arrière-plan
        let config = URLSessionConfiguration.background(withIdentifier: "com.foodix.share.upload.\(UUID().uuidString)")
        config.sharedContainerIdentifier = appGroupIdentifier
        config.isDiscretionary = false
        
        let session = URLSession(configuration: config, delegate: nil, delegateQueue: nil)
        var request = URLRequest(url: URL(string: "https://gaby-backend-victor2024-c7b0d533c9ca.herokuapp.com/recipes/jobs")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let task = session.uploadTask(with: request, fromFile: file)
        task.resume()
        
        print("🚀 [ShareExtension] Upload en arrière-plan lancé...")
    }
    
    // MARK: - App Group Sharing
    
    private func shareURLInAppGroup(url: String) {
        print("💾 [ShareExtension] Partage de l'URL dans l'App Group: \(url)")
        
        // Sauvegarder l'URL dans UserDefaults de l'App Group
        sharedUserDefaults?.set(url, forKey: "sharedURL")
        sharedUserDefaults?.synchronize()
        
        print("✅ [ShareExtension] URL sauvegardée dans l'App Group")
    }
    
    // MARK: - App Opening
    
    private func openFoodixWithURL(url: String) {
        print("🚀 [ShareExtension] Ouverture de Foodix avec l'URL: \(url)")
        
        // Créer le deep link vers Foodix
        let foodixURL = "foodix://share?url=\(url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? url)"
        print("🔗 [ShareExtension] Deep link Foodix: \(foodixURL)")
        
        // Ouvrir Foodix
        if let url = URL(string: foodixURL) {
            var responder = self as UIResponder?
            while responder != nil {
                if let application = responder as? UIApplication {
                    application.open(url, options: [:]) { success in
                        if success {
                            print("✅ [ShareExtension] Foodix ouvert avec succès")
                        } else {
                            print("❌ [ShareExtension] Échec d'ouverture de Foodix")
                        }
                    }
                    break
                }
                responder = responder?.next
            }
        }
    }

    // MARK: - URL Extraction

    private func extractURL(completion: @escaping (URL?) -> Void) {
        print("🔍 [ShareExtension] ==========================================")
        print("🔍 [ShareExtension] Début de l'extraction d'URL")

        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            print("❌ [ShareExtension] Aucun inputItems trouvé")
            completion(nil)
            return
        }

        print("📦 [ShareExtension] \(items.count) item(s) reçu(s)")

        let providers = items.compactMap { $0.attachments }.flatMap { $0 }
        print("📎 [ShareExtension] \(providers.count) provider(s) trouvé(s)")

        // Chercher d'abord une URL directe
        if let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
            print("🔗 [ShareExtension] URL directe détectée, chargement...")
            provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { item, error in
                if let error = error {
                    print("❌ [ShareExtension] Erreur chargement URL: \(error)")
                }
                if let url = item as? URL {
                    print("✅ [ShareExtension] URL directe extraite: \(url.absoluteString)")
                } else {
                    print("⚠️ [ShareExtension] URL directe invalide")
                }
                completion(item as? URL)
            }
            return
        }
        
        // Sinon chercher dans le texte
        if let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) {
            print("📝 [ShareExtension] Texte détecté, recherche d'URL...")
            provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { item, error in
                if let error = error {
                    print("❌ [ShareExtension] Erreur chargement texte: \(error)")
                }
                if let text = item as? String {
                    print("📄 [ShareExtension] Texte reçu: \(text)")
                    if let range = text.range(of: #"https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\/[^\s]+"#, options: .regularExpression) {
                        let foundURL = String(text[range])
                        print("✅ [ShareExtension] URL trouvée dans le texte: \(foundURL)")
                        completion(URL(string: foundURL))
                    } else {
                        print("⚠️ [ShareExtension] Aucune URL Instagram/TikTok trouvée dans le texte")
                        completion(nil)
                    }
            } else {
                    print("⚠️ [ShareExtension] Texte invalide")
                    completion(nil)
                }
            }
            return
        }

        print("❌ [ShareExtension] Aucun provider compatible trouvé")
        completion(nil)
    }


    
    
}