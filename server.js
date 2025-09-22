const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 Configuration sécurité
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

// 🌐 Configuration CORS
app.use(cors({
  origin: ['https://gaby-app.com', 'http://localhost:3000'],
  credentials: true
}));

// 🚫 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes, réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 📝 Parsing JSON
app.use(express.json({ limit: '10mb' }));

// 🔐 Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }
  
  if (token !== process.env.GABY_AUTH_TOKEN) {
    return res.status(403).json({ error: 'Token invalide' });
  }
  
  next();
};

// 🧠 Service OpenAI
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 📋 Schémas de validation
const conversationAnalysisSchema = Joi.object({
  ocrResults: Joi.array().items(Joi.string()).required(),
  profile: Joi.object({
    name: Joi.string().required(),
    gender: Joi.string().valid('male', 'female', 'other').required()
  }).required(),
  userComment: Joi.string().allow(''),
  shouldSuggestResponse: Joi.boolean().default(false),
  type: Joi.string().valid('conversation_analysis').required(),
  source: Joi.string().valid('ocr', 'import').optional()
});

const chatSchema = Joi.object({
  message: Joi.string().required(),
  context: Joi.string().allow(''),
  image_base64: Joi.string().allow(''),
  type: Joi.string().valid('chat').required()
});

// 🏠 Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Gaby Backend',
    timestamp: new Date().toISOString()
  });
});

// 🍳 NOUVEAUX ENDPOINTS POUR LES RECETTES
// Route de génération de recette
app.post('/generate-recipe', async (req, res) => {
  try {
    console.log('🍳 [RECIPE] Nouvelle demande de génération de recette');
    const { platform, url, author, caption, thumbnail } = req.body;
    
    console.log('📝 [RECIPE] Données reçues:', {
      platform,
      url,
      author,
      captionLength: caption?.length || 0,
      thumbnail: thumbnail ? 'Présent' : 'Absent'
    });

    const systemPrompt = `Tu es un expert culinaire. Génère une recette complète au format JSON strict:

{
  "id": "uuid-généré",
  "createdAt": "2025-09-17T13:00:00.000Z",
  "title": "Titre de la recette",
  "summary": "Description courte et appétissante",
  "servings": 4,
  "time": {"prep": 15, "cook": 30, "total": 45},
  "difficulty": "easy|medium|hard",
  "ingredients": [{"item": "Nom de l'ingrédient", "quantity": 200, "unit": "g", "notes": null}],
  "instructions": [{"step": 1, "text": "Description détaillée de l'étape"}],
  "nutrition": {"calories": 350, "protein": 25, "carbs": 30, "fat": 15},
  "proTips": ["Conseil de pro 1", "Conseil de pro 2"],
  "source": {"platform": "instagram", "url": "URL originale", "author": "Auteur", "thumbnail": "URL de l'image"}
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
    recipeJson = recipeJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let recipe = JSON.parse(recipeJson);
    recipe.id = require('crypto').randomUUID();
    recipe.createdAt = new Date().toISOString();
    
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

// Route de reformulation de recette
app.post('/reformulate-recipe', async (req, res) => {
  try {
    console.log('✨ [REFORMULATE] Nouvelle demande de reformulation');
    const { recipeId, reformulationType } = req.body;
    
    console.log('🔄 [REFORMULATE] Paramètres:', { recipeId, reformulationType });

    const prompts = {
      simplify: "Simplifie cette recette pour la rendre plus accessible aux débutants. Utilise des termes simples, réduis le nombre d'ingrédients si possible, et donne des instructions très claires.",
      detailed: "Détaille davantage cette recette en ajoutant plus d'explications, de conseils techniques, et de variantes. Rends-la plus professionnelle et complète.",
      professional: "Reformule cette recette dans un style de chef professionnel. Utilise un vocabulaire technique précis, des techniques avancées, et un ton expert.",
      casual: "Reformule cette recette dans un style décontracté et amical. Utilise un langage familier, des expressions courantes, et un ton chaleureux."
    };

    const systemPrompt = `Tu es un expert culinaire qui reformule des recettes selon différents styles.

Style demandé: ${reformulationType}
Instructions: ${prompts[reformulationType]}

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
    recipeJson = recipeJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let recipe = JSON.parse(recipeJson);
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

// Route de test pour les recettes
app.get('/test-recipe', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Recipe Service',
    endpoints: ['/generate-recipe', '/reformulate-recipe'],
    timestamp: new Date().toISOString()
  });
});

// 🔍 Route d'analyse de conversation (GABY)
app.post('/api/analyze', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Nouvelle demande d\'analyse reçue');
    
    const { error, value } = conversationAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.details[0].message 
      });
    }

    const { ocrResults, profile, userComment, shouldSuggestResponse, source } = value;
    
    const responseInstructions = shouldSuggestResponse 
      ? `1. Une analyse complète du ton et des intentions
2. Des conseils de réponse concrets
3. Une évaluation du niveau d'intérêt du crush
4. Des red flags éventuels
5. Des recommandations pour la suite`
      : `Note: Compte tenu du fait que l'utilisateur n'a pas demandé de suggestions de réponse, je ne propose pas de conseils de réponse concrets à ces messages.

1. Une analyse complète du ton et des intentions
2. Une évaluation du niveau d'intérêt du crush
3. Des red flags éventuels
4. Des recommandations pour la suite`;
    
    const baseRulesAnalyze = `RÈGLES PRIORITAIRES:\n` +
      `1) Tutoie TOUJOURS la personne (tu/ton/ta/tes). Jamais de vouvoiement.\n` +
      `2) N'emploie JAMAIS le terme "l'utilisateur" pour parler à la personne. Adresse-toi directement (ex: \"tu peux\", \"je te conseille\").\n` +
      `3) N'utilise pas le prénom du crush pour t'adresser à la personne (pas de \"Prénom, ...\" en tête).\n` +
      `4) Ton ton est proche, empathique et concret (meilleure amie psy).`;

    const ocrStyleRules = (source === 'ocr')
      ? `\n\nConsignes de style (OCR):\n- Adresse-toi uniquement à l'utilisateur en le tutoyant ("tu").\n- Ne donne jamais de consignes au/à la crush; parle d'elle/lui à la 3e personne.\n- Ne parle jamais de l'utilisateur à la 3e personne (évite « la personne » pour le lecteur).\n- Si tu utilises « la personne », cela désigne le/la crush (pas le lecteur).\n- Reste cohérent du début à la fin.`
      : '';

    const systemPrompt = `${baseRulesAnalyze}\n\nTu es Gaby, l'assistante relationnelle experte. Tu analyses les conversations pour donner des conseils sur les relations amoureuses.${ocrStyleRules}

Contexte:
- Nom du crush: ${profile.name}
- Genre: ${profile.gender}
- Commentaire utilisateur: ${userComment || 'Aucun commentaire spécifique'}
- Suggestions de réponse demandées: ${shouldSuggestResponse ? 'Oui' : 'Non'}

Analyse cette conversation et fournis:
${responseInstructions}

Sois empathique, précise et donne des conseils pratiques.`;

    const userPrompt = `Voici les textes extraits de la conversation (dans l'ordre chronologique):

${ocrResults.map((text, index) => `--- Message ${index + 1} ---\n${text}`).join('\n\n')}

Analyse cette conversation en détail.`;

    console.log('🧠 Envoi à OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    let analysis = completion.choices[0].message.content;

    analysis = analysis
      .replace(/\bl['']utilisateur\b/gi, 'toi')
      .replace(/\butilisateur\b/gi, 'toi')
      .replace(/\bvous\b/gi, 'tu')
      .replace(/\bvos\b/gi, 'tes')
      .replace(/\bvotre\b/gi, 'ton/ta');
    
    console.log('✅ Analyse terminée avec succès');
    
    res.json({
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString(),
      messageCount: ocrResults.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    
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
      timestamp: new Date().toISOString()
    });
  }
});

// 💬 Route de chat avec Gaby
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    console.log('💬 Nouvelle conversation avec Gaby');
    
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.details[0].message 
      });
    }

    const { message, context, image_base64 } = value;
    
    const baseRules = `RÈGLES PRIORITAIRES:
1) Tu tutoies TOUJOURS l'utilisateur. Jamais de vouvoiement.
2) Tu ne t'adresses JAMAIS à l'utilisateur en utilisant le prénom du crush. N'utilise pas de prénom en en-tête (ex: "Margot, ..."). Préfère des formulations neutres ("ok", "je te propose", "si tu veux...").
3) Ton ton est celui d'une meilleure amie psychologue: empathique, direct, constructif, sans jugement.`;
    
    const systemPrompt = (context && context.trim().length > 0)
      ? `${baseRules}\n\n${context}`
      : `${baseRules}\n\nTu es Gaby, une assistante relationnelle bienveillante et objective. Tu réponds de façon naturelle et empathique tout en restant neutre.

Ton style:
- Réponses NATURELLES et BIENVEILLANTES (2-4 phrases)
- TUTOIE TOUJOURS l'utilisateur (utilise "tu", jamais "vous")
- OBJECTIVE et ÉQUILIBRÉE, tu présentes les faits sans jugement
- EMPATHIQUE mais RÉALISTE, tu comprends les émotions sans les valider aveuglément
- Tu identifies les signaux positifs ET négatifs de façon neutre
- Tu poses des questions de clarification quand tu manques d'éléments
- Tu alimentes la conversation en proposant des pistes de réflexion
- Tu ne réponds qu'aux questions liées aux relations et à la communication

Après avoir répondu à la question principale, tu peux:
- Poser une question pour approfondir la situation
- Suggérer un angle d'analyse différent
- Proposer une prochaine étape concrète

IMPORTANT: Tu TUTOIES TOUJOURS, même si le contexte suggère le contraire.
Tu restes factuelle et constructive, sans complaisance ni pessimisme excessif.`;

    const userContent = (image_base64 && String(image_base64).trim().length > 0)
      ? [
          { type: 'text', text: String(message) },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
        ]
      : String(message);

    if (Array.isArray(userContent)) {
      console.log('🖼️ [CHAT] Vision activée sur /api/chat (image + prompt)');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    let response = completion.choices[0].message.content;
    
    response = response
      .replace(/\bvous\b/gi, 'tu')
      .replace(/\bvotre\b/gi, 'ton/ta')
      .replace(/\bvos\b/gi, 'tes')
      .replace(/\bêtes\b/gi, 'es')
      .replace(/\bavez\b/gi, 'as')
      .replace(/\bpouvez\b/gi, 'peux')
      .replace(/\bvoulez\b/gi, 'veux')
      .replace(/\bfaites\b/gi, 'fais')
      .replace(/\bdites\b/gi, 'dis')
      .replace(/\bvous aviez\b/gi, 'tu avais')
      .replace(/\bvous étiez\b/gi, 'tu étais')
      .replace(/\bvous devriez\b/gi, 'tu devrais')
      .replace(/\bvous pourriez\b/gi, 'tu pourrais');

    response = response.replace(/^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+\s*[,|:]\s+(?=\S)/, '');
    
    console.log('✅ Réponse de Gaby générée et corrigée (tutoiement forcé)');
    
    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors du chat:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      timestamp: new Date().toISOString()
    });
  }
});

// 💬 Endpoint pour la génération de réponses
app.post('/api/generate-responses', authenticateToken, async (req, res) => {
  try {
    console.log('✨ Nouvelle demande de génération de réponses');
    
    const { prompt, tone, max_tokens = 1000 } = req.body;
    
    if (!prompt || !tone) {
      return res.status(400).json({ 
        error: 'Prompt et tone requis' 
      });
    }
    
    console.log(`🎭 Ton demandé: ${tone}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: max_tokens,
      temperature: 0.8,
    });

    const response = completion.choices[0].message.content;
    
    const responses = response.split('###')
      .map(r => r.trim())
      .filter(r => r.length > 0)
      .slice(0, 3);
    
    while (responses.length < 3) {
      responses.push(`Réponse ${responses.length + 1} générée automatiquement.`);
    }
    
    console.log(`✅ ${responses.length} réponses générées avec succès`);
    
    res.json({
      success: true,
      responses: responses,
      tone: tone,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération de réponses:', error);
    
    const fallbackResponses = getFallbackResponses(req.body.tone || 'friendly');
    
    res.json({
      success: true,
      responses: fallbackResponses,
      tone: req.body.tone || 'friendly',
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
});

// 🖼️ Endpoint vision pour génération de réponses à partir d'un screenshot
app.post('/api/generate-responses-vision', authenticateToken, async (req, res) => {
  try {
    console.log('🖼️ Nouvelle demande de génération (VISION)');

    const { image_base64, prompt, tone, max_tokens = 1000 } = req.body;

    if (!image_base64 || !prompt || !tone) {
      return res.status(400).json({ error: 'image_base64, prompt et tone sont requis' });
    }

    console.log(`🎭 Ton demandé: ${tone}`);
    console.log(`📝 Prompt: ${String(prompt).substring(0, 100)}...`);

    const userContent = [
      { type: 'text', text: String(prompt) },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: userContent }
      ],
      max_tokens: max_tokens,
      temperature: 0.8,
    });

    const response = completion.choices?.[0]?.message?.content || '';

    const responses = String(response).split('###')
      .map(r => r.trim())
      .filter(r => r.length > 0)
      .slice(0, 3);

    while (responses.length < 3) {
      responses.push(`Réponse ${responses.length + 1} générée automatiquement.`);
    }

    console.log(`✅ ${responses.length} réponses VISION générées avec succès`);
    res.json({
      success: true,
      responses,
      tone,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur lors de la génération VISION:', error);
    res.status(500).json({ error: 'Erreur interne du serveur (vision)' });
  }
});

// Fonction helper pour les réponses de fallback
function getFallbackResponses(tone) {
  const fallbacks = {
    friendly: [
      "C'est gentil de ta part ! Comment ça va de ton côté ?",
      "Merci pour ton message 😊 J'ai hâte de te répondre plus longuement !",
      "Tu es adorable ! Raconte-moi comment s'est passée ta journée ?"
    ],
    flirty: [
      "Tu sais exactement quoi dire pour me faire sourire 😏",
      "Mmh... j'aime cette attention que tu me portes 😘",
      "Tu es en train de devenir irrésistible, tu le sais ça ? 😉"
    ],
    confident: [
      "J'apprécie ta franchise. Moi aussi j'ai quelque chose à te dire...",
      "Tu as du caractère, j'aime ça. On devrait se voir bientôt.",
      "Direct et honnête, exactement comme j'aime. Respecte ça chez toi."
    ],
    playful: [
      "Oh là là, qu'est-ce que tu mijotes encore ? 😜",
      "Tu es en train de comploter quelque chose, je le sens ! 🤔",
      "Hmm... je vois où tu veux en venir, petit malin ! 😄"
    ],
    sincere: [
      "Ça me touche vraiment que tu partages ça avec moi.",
      "Je suis reconnaissante pour ta sincérité. Ça compte beaucoup.",
      "Merci d'être si authentique avec moi. C'est précieux."
    ],
    humorous: [
      "Haha ! Tu vas me faire mourir de rire 😂",
      "Attention, avec des blagues comme ça tu vas devenir irrésistible ! 😄",
      "Tu es vraiment en train d'essayer de me charmer avec ton humour ? Ça marche ! 🤣"
    ]
  };
  
  return fallbacks[tone] || fallbacks.friendly;
}

// 🚫 Route par défaut
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

// 🚀 Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Gaby démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Auth configurée: ${process.env.GABY_AUTH_TOKEN ? '✅' : '❌'}`);
  console.log(`🧠 OpenAI configuré: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
});

// 💥 Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('💥 Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  process.exit(1);
});
