# 📊 Guide des Logs de Debug

## 🎯 Logs Ajoutés

J'ai ajouté des logs détaillés dans toute l'application pour vous permettre de suivre le processus de génération de recette étape par étape.

### 📱 HomeScreen (Écran Principal)

**Logs ajoutés dans :**
- `processInput()` - Processus principal de génération
- `generateRecipeFromDescription()` - Génération à partir de description
- `generateRecipeFromData()` - Génération à partir d'URL Instagram

**Exemple de logs :**
```
🚀 [HomeScreen] Début du processus de génération de recette
📝 [HomeScreen] URL/Description saisie: https://instagram.com/p/example
🔍 [HomeScreen] Type d'input détecté: URL Instagram
📱 [HomeScreen] Cas 1: URL Instagram détectée, récupération des données oEmbed...
✅ [HomeScreen] Données oEmbed récupérées: {title: "...", author: "...", thumbnail: "Présent"}
```

### 🌐 Service API

**Logs ajoutés dans :**
- `generateRecipe()` - Appel vers votre serveur Heroku
- Gestion des erreurs Axios détaillée

**Exemple de logs :**
```
🌐 [APIService] Début de la génération de recette
📦 [APIService] Payload reçu: {platform: "instagram", url: "...", author: "...", captionLength: 150}
🔗 [APIService] URL de l'endpoint: https://votre-app.herokuapp.com/generate-recipe
📡 [APIService] Envoi de la requête POST vers Heroku...
✅ [APIService] Réponse reçue du serveur Heroku: {status: 200, duration: "1250ms", dataSize: 2048}
```

### 💾 Store (Zustand)

**Logs ajoutés dans :**
- `addRecipe()` - Ajout de recette au store
- `saveRecipes()` - Sauvegarde dans AsyncStorage
- `reformulateRecipe()` - Reformulation de recette

**Exemple de logs :**
```
💾 [Store] Ajout d'une nouvelle recette
📝 [Store] Données de la recette: {title: "...", ingredientsCount: 8, instructionsCount: 6}
🆔 [Store] ID généré pour la recette: uuid-123
📊 [Store] Nombre total de recettes après ajout: 5
💾 [Store] Sauvegarde automatique...
✅ [Store] Recettes sauvegardées avec succès dans AsyncStorage
```

## 🔍 Comment Utiliser les Logs

### 1. Ouvrir la Console de Debug

**Sur iOS Simulator :**
- Cmd + D → "Debug" → Ouvrir Chrome DevTools

**Sur Android :**
- Cmd + M → "Debug" → Ouvrir Chrome DevTools

**Sur Expo Go :**
- Secouer l'appareil → "Debug Remote JS"

### 2. Filtrer les Logs

Dans la console Chrome, utilisez ces filtres :

**Tous les logs de l'app :**
```
[HomeScreen] OR [APIService] OR [Store]
```

**Seulement les erreurs :**
```
❌
```

**Seulement les appels API :**
```
🌐 OR 📡 OR ✅
```

**Seulement le store :**
```
[Store]
```

### 3. Logs Importants à Surveiller

**✅ Succès :**
- `✅ [APIService] Réponse reçue du serveur Heroku`
- `✅ [Store] Recette ajoutée et sauvegardée avec succès`

**❌ Erreurs :**
- `❌ [APIService] Erreur lors de la génération de recette`
- `❌ [Store] Erreur lors de la sauvegarde des recettes`

**🌐 Appels Réseau :**
- `📡 [APIService] Envoi de la requête POST vers Heroku`
- `🔗 [APIService] URL de l'endpoint: https://...`

## 🐛 Debugging avec les Logs

### Problème : "Impossible de joindre le serveur"

**Logs à vérifier :**
```
❌ [APIService] Erreur de requête (pas de réponse)
```

**Solutions :**
1. Vérifier `EXPO_PUBLIC_API_BASE_URL` dans `.env`
2. Vérifier que votre serveur Heroku est en ligne
3. Vérifier la connexion internet

### Problème : "Erreur 500: Erreur interne du serveur"

**Logs à vérifier :**
```
❌ [APIService] Erreur 500: Erreur interne du serveur
📡 [APIService] Erreur de réponse du serveur: {status: 500, data: {...}}
```

**Solutions :**
1. Vérifier les logs de votre serveur Heroku
2. Vérifier votre clé OpenAI
3. Vérifier le format des données envoyées

### Problème : "Recette non générée"

**Logs à vérifier :**
```
✅ [APIService] Réponse reçue du serveur Heroku
🔍 [APIService] Validation de la réponse avec Zod...
❌ [APIService] Erreur de validation ou autre
```

**Solutions :**
1. Vérifier que votre serveur retourne le bon format JSON
2. Vérifier que tous les champs requis sont présents

## 📈 Performance

Les logs incluent aussi des métriques de performance :

```
✅ [APIService] Réponse reçue du serveur Heroku: {duration: "1250ms", dataSize: 2048}
```

- **duration** : Temps de réponse du serveur
- **dataSize** : Taille des données reçues

## 🎨 Emojis Utilisés

- 🚀 Début de processus
- 📝 Données/Input
- 🔍 Détection/Analyse
- 📱 Instagram/URL
- 🌐 Appels API
- 📡 Requêtes réseau
- ✅ Succès
- ❌ Erreur
- 💾 Sauvegarde
- 🆔 ID généré
- 📊 Statistiques
- 🏁 Fin de processus
- ⏳ Chargement
- 🔄 Mise à jour
- 🧭 Navigation
- 🧹 Nettoyage

Maintenant vous pouvez suivre tout le processus de génération de recette en temps réel ! 🎉
