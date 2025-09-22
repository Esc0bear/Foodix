// 🍳 Endpoints pour la génération et reformulation de recettes
// À ajouter dans votre server.js existant

// 📋 Schémas de validation pour les recettes
const recipeGenerationSchema = Joi.object({
  platform: Joi.string().valid('instagram').required(),
  url: Joi.string().uri().required(),
  author: Joi.string().allow(null),
  caption: Joi.string().required(),
  thumbnail: Joi.string().uri().allow(null)
});

const recipeReformulationSchema = Joi.object({
  recipeId: Joi.string().required(),
  reformulationType: Joi.string().valid('simplify', 'detailed', 'professional', 'casual').required()
});

// 🍳 Route de génération de recette
app.post('/generate-recipe', async (req, res) => {
  try {
    console.log('🍳 [RECIPE] Nouvelle demande de génération de recette');
    
    // Validation des données
    const { error, value } = recipeGenerationSchema.validate(req.body);
    if (error) {
      console.log('❌ [RECIPE] Erreur de validation:', error.details[0].message);
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.details[0].message 
      });
    }

    const { platform, url, author, caption, thumbnail } = value;
    
    console.log('📝 [RECIPE] Données reçues:', {
      platform,
      url,
      author,
      captionLength: caption.length,
      thumbnail: thumbnail ? 'Présent' : 'Absent'
    });

    // Construire le prompt pour OpenAI
    const systemPrompt = `Tu es un expert culinaire et un générateur de recettes professionnel. 
Tu transformes des descriptions de plats, des posts Instagram, ou des idées culinaires en recettes complètes et détaillées.

RÈGLES IMPORTANTES:
1. Génère TOUJOURS une recette complète avec tous les champs requis
2. Utilise des quantités précises et des unités de mesure standard
3. Les instructions doivent être claires et étape par étape
4. Inclus des conseils de pro pertinents
5. Calcule des informations nutritionnelles réalistes
6. Adapte le niveau de difficulté selon la complexité de la recette
7. Utilise un titre accrocheur et un résumé appétissant

FORMAT DE RÉPONSE OBLIGATOIRE (JSON strict):
{
  "id": "uuid-généré",
  "createdAt": "2025-09-17T13:00:00.000Z",
  "title": "Titre de la recette",
  "summary": "Description courte et appétissante",
  "servings": 4,
  "time": {
    "prep": 15,
    "cook": 30,
    "total": 45
  },
  "difficulty": "easy|medium|hard",
  "ingredients": [
    {
      "item": "Nom de l'ingrédient",
      "quantity": 200,
      "unit": "g",
      "notes": "Préparation spéciale si nécessaire"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "text": "Description détaillée de l'étape"
    }
  ],
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbs": 30,
    "fat": 15
  },
  "proTips": [
    "Conseil de pro 1",
    "Conseil de pro 2"
  ],
  "source": {
    "platform": "instagram",
    "url": "URL originale",
    "author": "Auteur original",
    "thumbnail": "URL de l'image"
  }
}`;

    const userPrompt = `Génère une recette complète à partir de ces informations:

Plateforme: ${platform}
URL: ${url}
Auteur: ${author || 'Inconnu'}
Description: ${caption}
Image: ${thumbnail || 'Aucune'}

Crée une recette détaillée, appétissante et facile à suivre.`;

    console.log('🧠 [RECIPE] Envoi à OpenAI...');
    
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
    
    // Nettoyer la réponse JSON (enlever les markdown si présent)
    recipeJson = recipeJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('🔍 [RECIPE] Validation de la réponse JSON...');
    
    // Parser et valider la réponse JSON
    let recipe;
    try {
      recipe = JSON.parse(recipeJson);
    } catch (parseError) {
      console.error('❌ [RECIPE] Erreur de parsing JSON:', parseError);
      throw new Error('Réponse OpenAI invalide - format JSON incorrect');
    }
    
    // Générer un ID unique et timestamp
    recipe.id = require('crypto').randomUUID();
    recipe.createdAt = new Date().toISOString();
    
    // S'assurer que tous les champs requis sont présents
    if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
      throw new Error('Réponse OpenAI incomplète - champs manquants');
    }
    
    console.log('✅ [RECIPE] Recette générée avec succès:', {
      id: recipe.id,
      title: recipe.title,
      ingredientsCount: recipe.ingredients.length,
      instructionsCount: recipe.instructions.length
    });
    
    res.json(recipe);

  } catch (error) {
    console.error('❌ [RECIPE] Erreur lors de la génération:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'Quota OpenAI insuffisant' 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Limite de taux OpenAI dépassée, réessayez dans quelques instants' 
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✨ Route de reformulation de recette
app.post('/reformulate-recipe', async (req, res) => {
  try {
    console.log('✨ [REFORMULATE] Nouvelle demande de reformulation');
    
    // Validation des données
    const { error, value } = recipeReformulationSchema.validate(req.body);
    if (error) {
      console.log('❌ [REFORMULATE] Erreur de validation:', error.details[0].message);
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.details[0].message 
      });
    }

    const { recipeId, reformulationType } = value;
    
    console.log('🔄 [REFORMULATE] Paramètres:', { recipeId, reformulationType });

    // Pour l'instant, on simule une reformulation
    // Dans un vrai cas, vous récupéreriez la recette depuis une base de données
    const reformulationPrompts = {
      simplify: "Simplifie cette recette pour la rendre plus accessible aux débutants. Utilise des termes simples, réduis le nombre d'ingrédients si possible, et donne des instructions très claires.",
      detailed: "Détaille davantage cette recette en ajoutant plus d'explications, de conseils techniques, et de variantes. Rends-la plus professionnelle et complète.",
      professional: "Reformule cette recette dans un style de chef professionnel. Utilise un vocabulaire technique précis, des techniques avancées, et un ton expert.",
      casual: "Reformule cette recette dans un style décontracté et amical. Utilise un langage familier, des expressions courantes, et un ton chaleureux."
    };

    const systemPrompt = `Tu es un expert culinaire qui reformule des recettes selon différents styles.

Style demandé: ${reformulationType}
Instructions: ${reformulationPrompts[reformulationType]}

RÈGLES:
1. Garde la même structure JSON que la recette originale
2. Adapte le contenu selon le style demandé
3. Conserve toutes les informations essentielles
4. Améliore la clarté et l'accessibilité
5. Garde le même ID et timestamp

FORMAT DE RÉPONSE: JSON strict identique à la recette originale`;

    const userPrompt = `Reformule cette recette (ID: ${recipeId}) selon le style "${reformulationType}".

Note: Pour cette démo, génère une recette exemple de gâteau au chocolat que tu reformuleras selon le style demandé.`;

    console.log('🧠 [REFORMULATE] Envoi à OpenAI...');
    
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
    
    // Nettoyer la réponse JSON
    recipeJson = recipeJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('🔍 [REFORMULATE] Validation de la réponse JSON...');
    
    // Parser et valider la réponse JSON
    let recipe;
    try {
      recipe = JSON.parse(recipeJson);
    } catch (parseError) {
      console.error('❌ [REFORMULATE] Erreur de parsing JSON:', parseError);
      throw new Error('Réponse OpenAI invalide - format JSON incorrect');
    }
    
    // Garder l'ID original et mettre à jour le timestamp
    recipe.id = recipeId;
    recipe.createdAt = new Date().toISOString();
    
    console.log('✅ [REFORMULATE] Recette reformulée avec succès:', {
      id: recipe.id,
      title: recipe.title,
      reformulationType
    });
    
    res.json(recipe);

  } catch (error) {
    console.error('❌ [REFORMULATE] Erreur lors de la reformulation:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'Quota OpenAI insuffisant' 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Limite de taux OpenAI dépassée, réessayez dans quelques instants' 
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🏥 Route de test pour les recettes
app.get('/test-recipe', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Recipe Service',
    endpoints: ['/generate-recipe', '/reformulate-recipe'],
    timestamp: new Date().toISOString()
  });
});
