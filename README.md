# Foodix - Générateur de Recettes IA

🍽️ **Transformez vos posts Instagram, TikTok et Facebook en recettes détaillées avec l'intelligence artificielle !**

## ✨ Fonctionnalités

### 🎯 Génération de Recettes
- **Extraction automatique** des données depuis Instagram, TikTok, Facebook
- **Génération IA** de recettes complètes avec ingrédients, instructions et conseils
- **Validation Zod** pour garantir la qualité des données

### 📱 Interface Moderne
- **Design inspiré de ReelMeal** avec palette violette élégante
- **Navigation intuitive** avec onglets en bas
- **Animations fluides** et ombres subtiles
- **Typographie moderne** et espacement harmonieux

### 💾 Gestion des Recettes
- **Sauvegarde locale** avec AsyncStorage
- **Filtres avancés** par difficulté, temps, plateforme
- **Recherche textuelle** dans les titres et ingrédients
- **Suppression** avec confirmation

### 🔗 Partage de Liens
- **Reçoit les liens partagés** depuis Instagram, TikTok, Facebook
- **Détection automatique** de la plateforme source
- **Pré-remplissage** du champ URL
- **Support multi-plateforme** iOS et Android

## 🚀 Installation

### Prérequis
- Node.js 18+
- Expo CLI
- iOS Simulator ou Android Emulator

### Installation
```bash
# Cloner le projet
cd /Users/rsetcompany/Desktop/Foodix/recipe-reels-saver

# Installer les dépendances
npm install

# Démarrer l'application
npx expo start
```

## 🔧 Configuration

### Variables d'Environnement
Créer un fichier `.env` à la racine :
```env
EXPO_PUBLIC_FB_APP_ID=your_facebook_app_id
EXPO_PUBLIC_FB_CLIENT_TOKEN=your_facebook_client_token
EXPO_PUBLIC_API_BASE_URL=https://your-heroku-server.herokuapp.com
EXPO_PUBLIC_PRIVACY_URL=https://example.com/privacy
EXPO_PUBLIC_TERMS_URL=https://example.com/terms
EXPO_PUBLIC_SUPPORT_EMAIL=support@example.com
```

### Serveur Heroku (Proxy OpenAI)
L'application nécessite un serveur Heroku qui fait le proxy vers OpenAI :
- **Endpoint** : `POST /generate-recipe`
- **Payload** : `{ platform, url, author, caption, thumbnail }`
- **Réponse** : Recette validée par Zod

## 📱 Test du Partage de Liens

### iOS Simulator
1. **Ouvrir Safari** dans le simulateur
2. **Naviguer vers** un post Instagram public
3. **Appuyer sur Partager** (icône carrée avec flèche)
4. **Sélectionner Foodix** dans la liste des apps
5. **Confirmer** dans l'alerte qui apparaît
6. **L'URL se pré-remplit** automatiquement dans l'app

### Android Emulator
1. **Ouvrir Chrome** dans l'émulateur
2. **Naviguer vers** un post Instagram public
3. **Appuyer sur Partager** (3 points verticaux)
4. **Sélectionner Foodix** dans la liste des apps
5. **Confirmer** dans l'alerte qui apparaît
6. **L'URL se pré-remplit** automatiquement dans l'app

### Test avec des URLs
Vous pouvez aussi tester directement avec des URLs :
- `https://www.instagram.com/p/ABC123/`
- `https://www.tiktok.com/@user/video/123456`
- `https://www.facebook.com/post/123456`

## 🎨 Design System

### Couleurs
- **Primary 700** : `#6B21A8` (CTA principal)
- **Primary 500** : `#A855F7` (Accents)
- **Primary 100** : `#F3F0FF` (Fonds)
- **Accent Teal** : `#14B8A6` (Texte secondaire)

### Typographie
- **Police** : System (native)
- **Tailles** : 12px à 36px
- **Poids** : 400 (normal) à 800 (extrabold)

### Espacement
- **xs** : 4px
- **sm** : 8px
- **md** : 16px
- **lg** : 24px
- **xl** : 32px

## 🏗️ Architecture

### Structure des Dossiers
```
/app
  /components     # Composants réutilisables
  /navigation     # Navigation React Navigation
  /screens        # Écrans principaux
  /services       # Services API et utilitaires
  /store          # État global Zustand
  /theme          # Système de design
  /types          # Types TypeScript
  /utils          # Fonctions utilitaires
```

### Technologies
- **React Native** avec Expo
- **TypeScript** pour le typage
- **Zustand** pour l'état global
- **React Navigation** pour la navigation
- **AsyncStorage** pour la persistance
- **Zod** pour la validation
- **Axios** pour les appels API

## 🔄 Flux de Données

1. **URL saisie** → Validation
2. **oEmbed API** → Extraction métadonnées
3. **Heroku Proxy** → Génération IA
4. **Validation Zod** → Vérification structure
5. **Zustand Store** → Sauvegarde locale
6. **Navigation** → Affichage détails

## 🐛 Debugging

### Logs
- **Console** : Logs détaillés dans Metro
- **Toast** : Notifications utilisateur
- **Alert** : Confirmations importantes

### Erreurs Communes
- **oEmbed 404** : Vérifier les clés Facebook
- **API 404** : Vérifier l'URL Heroku
- **Validation Zod** : Structure de recette incorrecte

## 📋 TODO

- [ ] Support YouTube
- [ ] Export PDF des recettes
- [ ] Partage de recettes
- [ ] Mode hors ligne
- [ ] Synchronisation cloud
- [ ] Notifications push

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

---

**Fait avec ❤️ pour les foodies gourmands** 🍽️