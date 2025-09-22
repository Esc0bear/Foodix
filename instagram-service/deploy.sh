#!/bin/bash

# Script de déploiement du service Instagram sur Heroku

echo "🚀 Déploiement du service Instagram sur Heroku..."

# Vérifier si Heroku CLI est installé
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI n'est pas installé. Installez-le d'abord :"
    echo "   brew install heroku/brew/heroku"
    exit 1
fi

# Vérifier si on est connecté à Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Heroku. Connectez-vous d'abord :"
    echo "   heroku login"
    exit 1
fi

# Créer l'app Heroku si elle n'existe pas
echo "📱 Création de l'app Heroku..."
if ! heroku apps:info ig-caption-foodix &> /dev/null; then
    heroku create ig-caption-foodix
    echo "✅ App Heroku créée : ig-caption-foodix"
else
    echo "✅ App Heroku existante : ig-caption-foodix"
fi

# Configurer les variables d'environnement
echo "⚙️ Configuration des variables d'environnement..."
heroku config:set CORS_ORIGIN="*" --app ig-caption-foodix
heroku config:set IG_DOC_IDS="10015901848480474,8845758991822021,8845757868488799" --app ig-caption-foodix

echo "✅ Variables d'environnement configurées"

# Déployer
echo "📦 Déploiement en cours..."
git add .
git commit -m "Deploy Instagram service to Heroku" || echo "Aucun changement à commiter"
git push heroku main

echo "🎉 Déploiement terminé !"
echo "🌐 URL du service : https://ig-caption-foodix.herokuapp.com"
echo "🔍 Test : https://ig-caption-foodix.herokuapp.com/health"
