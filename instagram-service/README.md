# Service Instagram pour Foodix

Service dédié à l'extraction des légendes Instagram via l'API GraphQL.

## 🚀 Déploiement Heroku

### Option 1: Heroku CLI (Recommandé)

```bash
# Créer l'app Heroku
heroku create ig-caption-foodix

# Configurer les variables d'environnement
heroku config:set CORS_ORIGIN=https://your-app-domain.com
heroku config:set IG_DOC_IDS=10015901848480474,8845758991822021,8845757868488799

# Déployer
git add .
git commit -m "Initial commit"
git push heroku main
```

### Option 2: Interface Web Heroku

1. Créer une nouvelle app : `ig-caption-foodix`
2. Connecter le repository GitHub
3. Configurer les variables d'environnement
4. Déployer automatiquement

## 📡 Endpoints

### Health Check
```
GET /health
```

### Extraire une légende
```
GET /api/caption?url=https://www.instagram.com/p/DOd2EcviIiC/
```

### Test
```
GET /api/test
```

## 🔧 Configuration

- **Rate Limiting** : 100 requêtes/15min par IP
- **Cache** : 24h par URL
- **Fallback** : 3 doc_id différents
- **Retry** : 2 tentatives par doc_id

## 🛠️ Développement local

```bash
cd instagram-service
npm install
npm run dev
```

## 📝 Notes

- Les doc_id Instagram peuvent changer
- Le cache évite les appels répétés
- Rate limiting pour éviter les blocages
- CORS configuré pour l'app mobile
