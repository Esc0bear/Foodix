import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { LRUCache } from 'lru-cache';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true 
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use('/api/', limiter);

const PORT = Number(process.env.PORT || 3000);

// Doc IDs Instagram avec fallback (mis à jour 2024)
const IG_DOC_IDS = (process.env.IG_DOC_IDS || '10015901848480474')
  .split(',').map(s => s.trim()).filter(Boolean);

// Cache LRU pour 24h
const cache = new LRUCache({ 
  max: 1000, 
  ttl: 1000 * 60 * 60 * 24 // 24h
});

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36';
const SHORTCODE_RE = /instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i;

// Extraction du shortcode depuis l'URL
const toShortcode = (url) => {
  const match = url.match(SHORTCODE_RE);
  return match ? match[1] : null;
};

// Parsing de la légende depuis la réponse JSON
const parseCaption = (json) => {
  const media = json?.data?.xdt_shortcode_media ?? json?.data?.shortcode_media;
  if (!media) return null;
  
  const candidates = [
    media?.edge_media_to_caption?.edges?.[0]?.node?.text,
    media?.caption,
    media?.title,
    media?.accessibility_caption
  ];
  
  const found = candidates.find(t => typeof t === 'string' && t.trim());
  return found ? found.trim() : null;
};

// Récupération d'une légende avec un doc_id spécifique
async function fetchCaption(shortcode, docId) {
  const variables = encodeURIComponent(JSON.stringify({ shortcode }));
  const body = `variables=${variables}&doc_id=${docId}`;
  
  const response = await fetch('https://www.instagram.com/api/graphql', {
    method: 'POST',
    headers: { 
      'content-type': 'application/x-www-form-urlencoded', 
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'referer': 'https://www.instagram.com/',
      'x-csrftoken': 'missing',
      'x-instagram-ajax': '1',
      'x-ig-app-id': '936619743392459',
      'x-ig-www-claim': '0',
      'accept': '*/*',
      'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin'
    },
    body
  });
  
  let json = null;
  let responseText = '';
  
  try { 
    responseText = await response.text();
    
    // Vérifier si la réponse est du HTML (erreur)
    if (responseText.trim().startsWith('<')) {
      console.log(`❌ Réponse HTML reçue pour doc_id ${docId} (probablement une erreur)`);
      return { 
        status: response.status, 
        caption: null,
        docId,
        error: 'HTML response received'
      };
    }
    
    json = JSON.parse(responseText);
  } catch (e) {
    console.log(`❌ Erreur parsing pour doc_id ${docId}:`, e.message);
    console.log(`📄 Première partie de la réponse:`, responseText.substring(0, 200));
    return { 
      status: response.status, 
      caption: null,
      docId,
      error: e.message
    };
  }
  
  return { 
    status: response.status, 
    caption: parseCaption(json),
    docId 
  };
}

// Récupération avec fallback sur plusieurs doc_id
async function getCaptionWithFallback(shortcode) {
  console.log(`🔍 Recherche de la légende pour shortcode: ${shortcode}`);
  
  for (const docId of IG_DOC_IDS) {
    console.log(`📡 Tentative avec doc_id: ${docId}`);
    
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { status, caption, docId: usedDocId } = await fetchCaption(shortcode, docId);
        
        if (status === 200 && caption) {
          console.log(`✅ Légende trouvée avec doc_id ${usedDocId}`);
          return { caption, docId: usedDocId };
        }
        
        console.log(`⚠️ Doc_id ${docId} - Status: ${status}, Caption: ${caption ? 'Trouvée' : 'Non trouvée'}`);
        
        // Attendre avant le retry
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
        }
      } catch (error) {
        console.log(`❌ Erreur avec doc_id ${docId}:`, error.message);
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  
  console.log(`❌ Aucune légende trouvée pour ${shortcode}`);
  return null;
}

// Health check
app.get('/health', (_, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    docIds: IG_DOC_IDS.length,
    cacheSize: cache.size
  });
});

// Endpoint principal
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
        docId: cached.docId,
        cached: true,
        url: url
      });
    }
    
    // Récupérer la légende
    const result = await getCaptionWithFallback(shortcode);
    
    if (!result) {
      return res.status(404).json({ 
        error: 'Légende non trouvée',
        url: url
      });
    }
    
    // Mettre en cache
    cache.set(cacheKey, result);
    
    res.json({
      success: true,
      caption: result.caption,
      docId: result.docId,
      cached: false,
      url: url
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
app.get('/api/test', async (req, res) => {
  const testUrl = 'https://www.instagram.com/p/DOd2EcviIiC/';
  const shortcode = toShortcode(testUrl);
  
  res.json({
    testUrl,
    shortcode,
    docIds: IG_DOC_IDS,
    cacheSize: cache.size,
    message: 'Service Instagram opérationnel'
  });
});

// Endpoint de test avec une URL Instagram publique
app.get('/api/test-public', async (req, res) => {
  try {
    // Utiliser une URL Instagram publique connue pour le test
    const testUrl = 'https://www.instagram.com/p/CKuR3hpFpTQ/'; // Exemple d'URL publique
    const shortcode = toShortcode(testUrl);
    
    if (!shortcode) {
      return res.status(400).json({ error: 'URL de test invalide' });
    }
    
    console.log(`🧪 Test avec URL publique: ${testUrl}`);
    const result = await getCaptionWithFallback(shortcode);
    
    res.json({
      testUrl,
      shortcode,
      result,
      docIds: IG_DOC_IDS,
      cacheSize: cache.size
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors du test',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Instagram démarré sur le port ${PORT}`);
  console.log(`📡 Doc IDs configurés: ${IG_DOC_IDS.join(', ')}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Test: http://localhost:${PORT}/api/test`);
});
