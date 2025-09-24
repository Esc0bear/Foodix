//
//  AppGroupManager.swift
//  Foodix
//
//  Created by (RE)SET on 23/09/2025.
//

import Foundation
import React

@objc(AppGroupManager)
class AppGroupManager: NSObject {
    
    private let appGroupIdentifier = "group.com.foodix.app"
    private let sharedUserDefaults = UserDefaults(suiteName: "group.com.foodix.app")
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func getSharedURLs(_ callback: @escaping RCTResponseSenderBlock) {
        guard let sharedDefaults = sharedUserDefaults else {
            print("❌ [AppGroupManager] Impossible d'accéder aux UserDefaults partagés")
            callback([NSNull(), "Impossible d'accéder aux UserDefaults partagés"])
            return
        }
        
        // Test de l'App Group
        if let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) {
            print("✅ [AppGroupManager] App Group path: \(containerURL.path)")
        } else {
            print("❌ [AppGroupManager] App Group container non accessible")
        }
        
        // Test d'écriture
        sharedDefaults.set(true, forKey: "ping")
        sharedDefaults.synchronize()
        let ping = sharedDefaults.bool(forKey: "ping")
        print("🔍 [AppGroupManager] Ping test: \(ping)")
        
        print("🔍 [AppGroupManager] Recherche des URLs partagées...")
        print("🔍 [AppGroupManager] App Group: \(appGroupIdentifier)")
        
        let dictionary = sharedDefaults.dictionaryRepresentation()
        print("🔍 [AppGroupManager] Total keys in UserDefaults: \(dictionary.count)")
        
        var sharedURLs: [[String: Any]] = []
        var allKeys: [String] = []
        
        // Vérifier d'abord la nouvelle clé simple
        if let simpleURL = sharedDefaults.string(forKey: "sharedURL") {
            print("🔍 [AppGroupManager] Found simple sharedURL: \(simpleURL)")
            sharedURLs.append([
                "key": "sharedURL",
                "url": simpleURL,
                "timestamp": Date().timeIntervalSince1970,
                "processed": false
            ])
            print("✅ [AppGroupManager] Added simple URL: \(simpleURL)")
        }
        
        for (key, value) in dictionary {
            allKeys.append(key)
            if key.hasPrefix("sharedURL_") {
                print("🔍 [AppGroupManager] Found sharedURL key: \(key)")
                print("🔍 [AppGroupManager] Value type: \(type(of: value))")
                print("🔍 [AppGroupManager] Value: \(value)")
                
                if let sharedData = value as? [String: Any] {
                    print("🔍 [AppGroupManager] Parsed as dictionary: \(sharedData)")
                    if let url = sharedData["url"] as? String,
                       let timestamp = sharedData["timestamp"] as? Double,
                       let processed = sharedData["processed"] as? Bool {
                        print("🔍 [AppGroupManager] URL: \(url), processed: \(processed)")
                        if !processed {
                            sharedURLs.append([
                                "key": key,
                                "url": url,
                                "timestamp": timestamp,
                                "processed": processed
                            ])
                            print("✅ [AppGroupManager] Added URL: \(url)")
                        } else {
                            print("⏭️ [AppGroupManager] Skipped processed URL: \(url)")
                        }
                    } else {
                        print("❌ [AppGroupManager] Failed to parse sharedData: \(sharedData)")
                    }
                } else {
                    print("❌ [AppGroupManager] Value is not a dictionary: \(value)")
                }
            }
        }
        
        print("🔍 [AppGroupManager] All keys: \(allKeys)")
        print("📥 [AppGroupManager] \(sharedURLs.count) URL(s) partagée(s) détectée(s)")
        callback([sharedURLs])
    }
    
    @objc
    func markURLAsProcessed(_ key: String, callback: @escaping RCTResponseSenderBlock) {
        guard let sharedDefaults = sharedUserDefaults else {
            callback([NSNull(), "Impossible d'accéder aux UserDefaults partagés"])
            return
        }
        
        if var sharedData = sharedDefaults.object(forKey: key) as? [String: Any] {
            sharedData["processed"] = true
            sharedDefaults.set(sharedData, forKey: key)
            sharedDefaults.synchronize()
            print("✅ [AppGroupManager] URL marquée comme traitée: \(key)")
            callback([true])
        } else {
            callback([NSNull(), "URL introuvable"])
        }
    }
    
    @objc
    func clearProcessedURLs(_ callback: @escaping RCTResponseSenderBlock) {
        guard let sharedDefaults = sharedUserDefaults else {
            callback([NSNull(), "Impossible d'accéder aux UserDefaults partagés"])
            return
        }
        
        let dictionary = sharedDefaults.dictionaryRepresentation()
        var removedCount = 0
        
        for (key, value) in dictionary {
            if key.hasPrefix("sharedURL_") {
                if let sharedData = value as? [String: Any],
                   let processed = sharedData["processed"] as? Bool,
                   processed {
                    sharedDefaults.removeObject(forKey: key)
                    removedCount += 1
                }
            }
        }
        
        sharedDefaults.synchronize()
        print("🗑️ [AppGroupManager] \(removedCount) URL(s) traitée(s) supprimée(s)")
        callback([removedCount])
    }
    
    @objc
    func testAppGroup(_ callback: @escaping RCTResponseSenderBlock) {
        guard let sharedDefaults = sharedUserDefaults else {
            callback([false, "UserDefaults partagés inaccessibles"])
            return
        }
        
        let testKey = "testKey_\(Date().timeIntervalSince1970)"
        let testValue = "testValue"
        
        sharedDefaults.set(testValue, forKey: testKey)
        sharedDefaults.synchronize()
        
        let retrievedValue = sharedDefaults.string(forKey: testKey)
        let success = retrievedValue == testValue
        
        sharedDefaults.removeObject(forKey: testKey)
        sharedDefaults.synchronize()
        
        print("🧪 [AppGroupManager] Test App Group: \(success ? "✅ SUCCESS" : "❌ FAILED")")
        callback([success, success ? "App Group fonctionne" : "App Group ne fonctionne pas"])
    }
}