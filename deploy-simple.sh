#!/bin/bash

echo "🚀 Déploiement simple des endpoints de recettes..."

# Créer un fichier temporaire avec les endpoints
cat > temp-endpoints.js << 'EOF'
// 🍳 Endpoints pour les recettes
app.post('/generate-recipe', async (req, res) => {
  try {
    console.log('🍳 [RECIPE] Nouvelle demande de génération de recette');
    const { platform, url, author, caption, thumbnail } = req.body;
    
    const systemPrompt = `Tu es un expert culinaire. Génère une recette complète au format JSON strict:
{
  "id": "uuid-généré",
  "createdAt": "2025-09-17T13:00:00.000Z",
  "title": "Titre de la recette",
  "summary": "Description courte",
  "servings": 4,
  "time": {"prep": 15, "cook": 30, "total": 45},
  "difficulty": "easy|medium|hard",
  "ingredients": [{"item": "Nom", "quantity": 200, "unit": "g", "notes": null}],
  "instructions": [{"step": 1, "text": "Description"}],
  "nutrition": {"calories": 350, "protein": 25, "carbs": 30, "fat": 15},
  "proTips": ["Conseil 1", "Conseil 2"],
  "source": {"platform": "instagram", "url": "URL", "author": "Auteur", "thumbnail": "URL"}
}`;

    const userPrompt = `Génère une recette à partir de: ${caption}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    let recipeJson = completion.choices[0].message.content;
    recipeJson = recipeJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let recipe = JSON.parse(recipeJson);
    recipe.id = require('crypto').randomUUID();
    recipe.createdAt = new Date().toISOString();
    
    console.log('✅ [RECIPE] Recette générée:', recipe.title);
    res.json(recipe);

  } catch (error) {
    console.error('❌ [RECIPE] Erreur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/reformulate-recipe', async (req, res) => {
  try {
    console.log('✨ [REFORMULATE] Nouvelle demande de reformulation');
    const { recipeId, reformulationType } = req.body;
    
    const prompts = {
      simplify: "Simplifie cette recette pour les débutants",
      detailed: "Détaille davantage cette recette",
      professional: "Style de chef professionnel",
      casual: "Style décontracté et amical"
    };

    const systemPrompt = `Reformule cette recette selon le style: ${reformulationType}
${prompts[reformulationType]}
Retourne le même format JSON.`;

    const userPrompt = `Reformule cette recette (ID: ${recipeId})`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    let recipeJson = completion.choices[0].message.content;
    recipeJson = recipeJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let recipe = JSON.parse(recipeJson);
    recipe.id = recipeId;
    recipe.createdAt = new Date().toISOString();
    
    console.log('✅ [REFORMULATE] Recette reformulée:', recipe.title);
    res.json(recipe);

  } catch (error) {
    console.error('❌ [REFORMULATE] Erreur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.get('/test-recipe', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Recipe Service',
    timestamp: new Date().toISOString()
  });
});
EOF

echo "📝 Ajout des endpoints au server.js..."

# Ajouter les endpoints avant la route par défaut
sed -i.bak '/app.use('\''\*'\'', (req, res) => {/i\
\
// 🍳 Endpoints pour les recettes\
// Ajoutés le '$(date)'\
' server.js

# Ajouter le contenu des endpoints
cat temp-endpoints.js >> server.js

echo "📤 Déploiement sur Heroku..."
git add server.js
git commit -m "🍳 Ajout des endpoints de recettes - $(date)"
git push heroku main

echo "🧹 Nettoyage..."
rm temp-endpoints.js server.js.bak

echo "✅ Déploiement terminé !"
echo "🔗 Testez: https://gaby-backend-victor2024-c7b0d533c9ca.herokuapp.com/test-recipe"
