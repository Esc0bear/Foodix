# Configuration de la Reformulation de Recettes

## 🎯 Fonctionnalité Ajoutée

J'ai ajouté une fonctionnalité complète de reformulation de recettes qui utilise votre serveur Heroku avec votre clé OpenAI. Voici ce qui a été implémenté :

### ✨ Nouvelles Fonctionnalités

1. **Bouton de Reformulation** : Un bouton avec l'icône ✨ à côté du titre de chaque recette
2. **Modal de Sélection** : Interface élégante pour choisir le style de reformulation
3. **4 Styles de Reformulation** :
   - 🎯 **Simplifier** : Rendre la recette plus simple et accessible
   - 📝 **Détailler** : Ajouter plus de détails et d'explications
   - 👨‍🍳 **Professionnel** : Style de chef professionnel
   - 😊 **Décontracté** : Ton plus familier et amical

### 🔧 Configuration Requise

#### 1. Serveur Heroku
Votre serveur Heroku doit avoir un endpoint `/reformulate-recipe` qui accepte :

```json
POST /reformulate-recipe
{
  "recipeId": "string",
  "reformulationType": "simplify" | "detailed" | "professional" | "casual"
}
```

#### 2. Réponse Attendue
Le serveur doit retourner une recette complète au format JSON :

```json
{
  "id": "string",
  "createdAt": "string",
  "title": "string",
  "summary": "string",
  "servings": number,
  "time": {
    "prep": number,
    "cook": number,
    "total": number
  },
  "difficulty": "easy" | "medium" | "hard",
  "ingredients": [...],
  "instructions": [...],
  "nutrition": {...},
  "proTips": [...],
  "source": {...}
}
```

#### 3. Variables d'Environnement
Assurez-vous que votre fichier `.env` contient :

```env
EXPO_PUBLIC_API_BASE_URL=https://votre-app-heroku.herokuapp.com
```

### 🚀 Comment Utiliser

1. **Ouvrir une recette** : Naviguez vers les détails d'une recette
2. **Cliquer sur ✨** : Appuyez sur le bouton de reformulation à côté du titre
3. **Choisir un style** : Sélectionnez le style de reformulation souhaité
4. **Attendre** : La recette sera reformulée via votre serveur Heroku
5. **Voir le résultat** : La recette sera mise à jour automatiquement

### 📁 Fichiers Modifiés

- `app/services/api.ts` : Ajout de la méthode `reformulateRecipe()`
- `app/types/recipe.ts` : Nouveaux types pour la reformulation
- `app/store/useRecipesStore.ts` : Intégration dans le store Zustand
- `app/screens/RecipeDetailScreen.tsx` : Interface utilisateur complète

### 🔄 Flux de Données

1. L'utilisateur sélectionne un style de reformulation
2. L'app appelle `reformulateRecipe()` du store
3. Le store appelle l'API `reformulateRecipe()` du service
4. Le service fait un POST vers `/reformulate-recipe` sur Heroku
5. Votre serveur Heroku utilise votre clé OpenAI pour reformuler
6. La recette reformulée est retournée et mise à jour dans l'app

### 🛠️ Prochaines Étapes

1. **Configurer votre serveur Heroku** avec l'endpoint `/reformulate-recipe`
2. **Tester la fonctionnalité** avec une recette existante
3. **Personnaliser les styles** selon vos besoins

La fonctionnalité est maintenant prête à être utilisée ! 🎉
