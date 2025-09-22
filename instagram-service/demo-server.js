import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { LRUCache } from 'lru-cache';

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true 
}));

const PORT = Number(process.env.PORT || 3001);

// Cache LRU pour 24h
const cache = new LRUCache({ 
  max: 1000, 
  ttl: 1000 * 60 * 60 * 24 // 24h
});

const SHORTCODE_RE = /instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i;

// Extraction du shortcode depuis l'URL
const toShortcode = (url) => {
  const match = url.match(SHORTCODE_RE);
  return match ? match[1] : null;
};

// Légendes de démonstration pour différents shortcodes
const DEMO_CAPTIONS = {
  'DOd2EcviIiC': `🍰 CAKE MARBRÉ😋

Enregistre la recette pour la retrouver facilement 👍🏻

RECETTE :
Pour le cake :
*170g de farine
*30g de poudre d'amandes
*1 c à c de levure chimique
*180g de sucre en poudre
*3 œufs à (température ambiante)
*150g de beurre doux (fondu)
*150g de chocolat noir (à dessert)
*10 cl de lait
*2 c à c d'extrait de vanille liquide
*1 pincée de vanille en poudre

Glaçage :
*150g de chocolat noir à dessert
*40g d'huile de pépins de raisin (ou de tournesol)

PRÉPARATION :
Faire fondre le beurre à feu doux dans une petite casserole, laisser refroidir complètement.
Préchauffer le four à 180 degrés (chaleur tournante).
Dans un saladier, mettre 3 jaunes d'œufs ( réserver les blancs).
Ajouter le sucre , la vanille liquide, la vanille en poudre aux jaunes d'œufs.Mélanger énergiquement!🥵
Incorporer le beurre fondu refroidi, mélanger de nouveau.
Ajouter 10cl de lait froid, remuer.
Incorporer la farine, la poudre d'amandes et la levure, mélanger avec un fouet.
Monter les blancs d'œufs en neige puis ajouter délicatement avec une maryse à la préparation.
Diviser la pâte à la vanille dans 2 saladiers( je mets un tout petit peu plus de pâte dans le saladier de préparation vanille que dans celui au chocolat).
Faire fondre le chocolat au bain-marie, puis l'incorporer dans l'un des 2 saladiers.
Mélanger avec un fouet.
Recouvrir un moule à cake de papier cuisson.
Verser une couche de préparation blanche puis une au chocolat.( Étaler chaque couches avec une Maryse).
Recommencer l'opération jusqu'à épuisement de la pâte. Avec un bâtonnet à brochette faire des sortes de S dans la longueur du marbré.
Enfourner pour 1 heure environ.
Sortir du four.
Laisser refroidir complètement avant de démouler.
Faire fondre 150g de chocolat au bain marie, puis incorporer petit à petit 40g d'huile.
Mettre le cake sur une grille à pâtisserie.
Verser le glaçage complètement).
Laisser figer au réfrigérateur au moins 2 heures ( il faut que le chocolat durcisse).`,

  'CKuR3hpFpTQ': `🥕 CARROT CAKE RECIPE

Perfect for breakfast or dessert! This moist carrot cake is packed with flavor and topped with cream cheese frosting.

INGREDIENTS:
- 2 cups all-purpose flour
- 2 tsp baking powder
- 1 tsp baking soda
- 1 tsp cinnamon
- 1/2 tsp salt
- 3 large eggs
- 1 cup granulated sugar
- 1 cup brown sugar
- 1 cup vegetable oil
- 2 tsp vanilla extract
- 3 cups grated carrots
- 1 cup chopped walnuts

FROSTING:
- 8 oz cream cheese
- 1/2 cup butter
- 4 cups powdered sugar
- 2 tsp vanilla extract

INSTRUCTIONS:
1. Preheat oven to 350°F
2. Mix dry ingredients in a bowl
3. Beat eggs, sugars, oil, and vanilla
4. Add dry ingredients gradually
5. Fold in carrots and walnuts
6. Bake for 30-35 minutes
7. Cool completely before frosting

#carrotcake #baking #dessert #recipe`,

  'CLCrPtRHeFl': `🍪 CHOCOLATE CHIP COOKIES

The best chocolate chip cookies recipe! Soft, chewy, and loaded with chocolate chips.

INGREDIENTS:
- 2 1/4 cups all-purpose flour
- 1 tsp baking soda
- 1 tsp salt
- 1 cup butter, softened
- 3/4 cup granulated sugar
- 3/4 cup brown sugar
- 2 large eggs
- 2 tsp vanilla extract
- 2 cups chocolate chips

INSTRUCTIONS:
1. Preheat oven to 375°F
2. Mix flour, baking soda, and salt
3. Cream butter and sugars
4. Beat in eggs and vanilla
5. Gradually add flour mixture
6. Stir in chocolate chips
7. Drop rounded tablespoons onto ungreased cookie sheets
8. Bake 9-11 minutes until golden brown

#cookies #chocolate #baking #dessert`
};

// Health check
app.get('/health', (_, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mode: 'DEMO',
    cacheSize: cache.size,
    availableShortcodes: Object.keys(DEMO_CAPTIONS)
  });
});

// Endpoint principal (mode démo)
app.get('/api/caption', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL Instagram requise' 
      });
    }
    
    const shortcode = toShortcode(url);
    if (!shortcode) {
      return res.status(400).json({ 
        error: 'URL Instagram invalide' 
      });
    }
    
    // Vérifier le cache
    const cacheKey = `caption_${shortcode}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`💾 Cache hit pour ${shortcode}`);
      return res.json({
        success: true,
        caption: cached.caption,
        docId: 'DEMO',
        cached: true,
        url: url,
        mode: 'DEMO'
      });
    }
    
    // Vérifier si on a une légende de démonstration
    const demoCaption = DEMO_CAPTIONS[shortcode];
    
    if (!demoCaption) {
      return res.status(404).json({ 
        error: 'Légende non trouvée',
        url: url,
        availableShortcodes: Object.keys(DEMO_CAPTIONS),
        mode: 'DEMO'
      });
    }
    
    // Mettre en cache
    cache.set(cacheKey, { caption: demoCaption, docId: 'DEMO' });
    
    console.log(`✅ Légende de démonstration trouvée pour ${shortcode}`);
    
    res.json({
      success: true,
      caption: demoCaption,
      docId: 'DEMO',
      cached: false,
      url: url,
      mode: 'DEMO'
    });
    
  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Endpoint de test
app.get('/api/test', (req, res) => {
  res.json({
    mode: 'DEMO',
    availableShortcodes: Object.keys(DEMO_CAPTIONS),
    cacheSize: cache.size,
    message: 'Service Instagram en mode démonstration'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Instagram DÉMO démarré sur le port ${PORT}`);
  console.log(`📱 Mode: DÉMONSTRATION`);
  console.log(`🎯 Shortcodes disponibles: ${Object.keys(DEMO_CAPTIONS).join(', ')}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Test: http://localhost:${PORT}/api/test`);
});
