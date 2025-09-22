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
  max: 50, // 50 requêtes par IP
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use('/api/', limiter);

const PORT = Number(process.env.PORT || 3003);

// Configuration Facebook App
const FB_APP_ID = process.env.FB_APP_ID || '788176416930273';
const FB_CLIENT_TOKEN = process.env.FB_CLIENT_TOKEN || '39253b234f3dabe9039be2a2816921af';
const ACCESS_TOKEN = `${FB_APP_ID}|${FB_CLIENT_TOKEN}`;

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

// Récupération d'une légende via l'endpoint officiel oEmbed
async function fetchCaption(shortcode, postUrl) {
  console.log(`🔍 Tentative d'extraction pour shortcode: ${shortcode}`);
  console.log(`🌐 URL complète: ${postUrl}`);
  
  try {
    const endpoint = 'https://graph.facebook.com/v23.0/instagram_oembed';
    const params = new URLSearchParams({
      url: postUrl,
      access_token: ACCESS_TOKEN,
      omitscript: 'true'
    });
    
    const url = `${endpoint}?${params.toString()}`;
    console.log(`📡 Appel de l'endpoint officiel: ${endpoint}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Foodix/1.0 (+https://foodix.app)',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
      },
      // Ne pas suivre les redirections pour debug
      redirect: 'manual'
    });
    
    console.log(`📡 Réponse reçue: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    
    // Vérifier si c'est une redirection
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      console.log(`🔄 Redirection détectée vers: ${location}`);
      throw new Error(`Redirection vers: ${location}`);
    }
    
    const responseText = await response.text();
    console.log(`📄 Première partie de la réponse:`, responseText.substring(0, 200));
    
    // Vérifier si la réponse est du HTML
    if (responseText.trim().startsWith('<')) {
      console.log(`❌ Réponse HTML reçue (probablement une erreur)`);
      return { 
        status: response.status, 
        caption: null,
        error: 'HTML response received'
      };
    }
    
    const json = JSON.parse(responseText);
    console.log(`📊 Structure de la réponse:`, JSON.stringify(json, null, 2).substring(0, 500));
    
    // Extraire la légende depuis la réponse oEmbed
    const caption = json.title || json.author_name || null;
    
    if (caption) {
      console.log(`✅ Légende trouvée: ${caption.length} caractères`);
    } else {
      console.log(`❌ Aucune légende trouvée dans la réponse oEmbed`);
    }
    
    return { 
      status: response.status, 
      caption: caption,
      data: json
    };
    
  } catch (error) {
    console.log(`❌ Erreur lors de la requête:`, error.message);
    return { 
      status: 500, 
      caption: null,
      error: error.message
    };
  }
}

// Health check
app.get('/health', (_, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mode: 'OFFICIAL_OEMBED',
    appId: FB_APP_ID,
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
        data: cached.data,
        cached: true,
        url: url,
        mode: 'OFFICIAL_OEMBED'
      });
    }
    
    // Récupérer la légende via oEmbed
    const result = await fetchCaption(shortcode, url);
    
    if (!result.caption) {
      return res.status(404).json({ 
        error: 'Légende non trouvée',
        url: url,
        mode: 'OFFICIAL_OEMBED',
        details: result.error || 'Aucune légende disponible'
      });
    }
    
    // Mettre en cache
    cache.set(cacheKey, { caption: result.caption, data: result.data });
    
    res.json({
      success: true,
      caption: result.caption,
      data: result.data,
      cached: false,
      url: url,
      mode: 'OFFICIAL_OEMBED'
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
    mode: 'OFFICIAL_OEMBED',
    appId: FB_APP_ID,
    cacheSize: cache.size,
    message: 'Service Instagram avec endpoint officiel oEmbed'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Instagram OFFICIEL démarré sur le port ${PORT}`);
  console.log(`📱 Mode: ENDPOINT OFFICIEL OEMBED`);
  console.log(`🎯 App ID: ${FB_APP_ID}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Test: http://localhost:${PORT}/api/test`);
});
