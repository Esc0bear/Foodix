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
  max: 30, // 30 requêtes par IP
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use('/api/', limiter);

const PORT = Number(process.env.PORT || 3004);

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

// Récupération d'une légende via scraping direct de la page Instagram
async function fetchCaption(shortcode, postUrl) {
  console.log(`🔍 Tentative d'extraction pour shortcode: ${shortcode}`);
  console.log(`🌐 URL complète: ${postUrl}`);
  
  try {
    // Headers pour simuler un navigateur réel
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    };
    
    console.log(`📡 Récupération de la page Instagram...`);
    const response = await fetch(postUrl, {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    });
    
    console.log(`📡 Réponse reçue: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`📄 Taille de la page HTML: ${html.length} caractères`);
    
    // Extraire la légende depuis le HTML
    const caption = extractCaptionFromHTML(html, shortcode);
    
    if (caption) {
      console.log(`✅ Légende trouvée: ${caption.length} caractères`);
      return { 
        status: response.status, 
        caption: caption,
        method: 'HTML_SCRAPING'
      };
    } else {
      console.log(`❌ Aucune légende trouvée dans le HTML`);
      return { 
        status: response.status, 
        caption: null,
        error: 'No caption found in HTML'
      };
    }
    
  } catch (error) {
    console.log(`❌ Erreur lors de la requête:`, error.message);
    return { 
      status: 500, 
      caption: null,
      error: error.message
    };
  }
}

// Extraction de la légende depuis le HTML de la page Instagram
function extractCaptionFromHTML(html, shortcode) {
  try {
    // Méthode 1: Chercher dans les meta tags
    const metaDescriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    if (metaDescriptionMatch) {
      const caption = metaDescriptionMatch[1];
      console.log(`📝 Légende trouvée via meta og:description: ${caption.length} caractères`);
      return caption;
    }
    
    // Méthode 2: Chercher dans les données JSON embarquées
    const jsonDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
    if (jsonDataMatch) {
      try {
        const sharedData = JSON.parse(jsonDataMatch[1]);
        const postData = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
        if (postData?.edge_media_to_caption?.edges?.[0]?.node?.text) {
          const caption = postData.edge_media_to_caption.edges[0].node.text;
          console.log(`📝 Légende trouvée via _sharedData: ${caption.length} caractères`);
          return caption;
        }
      } catch (e) {
        console.log(`⚠️ Erreur parsing _sharedData:`, e.message);
      }
    }
    
    // Méthode 3: Chercher dans les données JSON plus récentes
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">({.+?})<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd?.description) {
          const caption = jsonLd.description;
          console.log(`📝 Légende trouvée via JSON-LD: ${caption.length} caractères`);
          return caption;
        }
      } catch (e) {
        console.log(`⚠️ Erreur parsing JSON-LD:`, e.message);
      }
    }
    
    // Méthode 4: Chercher dans les données GraphQL embarquées
    const graphqlMatch = html.match(/"edge_media_to_caption":\s*{\s*"edges":\s*\[\s*{\s*"node":\s*{\s*"text":\s*"([^"]+)"/);
    if (graphqlMatch) {
      const caption = graphqlMatch[1];
      console.log(`📝 Légende trouvée via GraphQL embarqué: ${caption.length} caractères`);
      return caption;
    }
    
    console.log(`❌ Aucune légende trouvée avec toutes les méthodes`);
    return null;
    
  } catch (error) {
    console.log(`❌ Erreur lors de l'extraction:`, error.message);
    return null;
  }
}

// Health check
app.get('/health', (_, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mode: 'HYBRID_SCRAPING',
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
        cached: true,
        url: url,
        mode: 'HYBRID_SCRAPING'
      });
    }
    
    // Récupérer la légende via scraping
    const result = await fetchCaption(shortcode, url);
    
    if (!result.caption) {
      return res.status(404).json({ 
        error: 'Légende non trouvée',
        url: url,
        mode: 'HYBRID_SCRAPING',
        details: result.error || 'Aucune légende disponible'
      });
    }
    
    // Mettre en cache
    cache.set(cacheKey, { caption: result.caption });
    
    res.json({
      success: true,
      caption: result.caption,
      cached: false,
      url: url,
      mode: 'HYBRID_SCRAPING'
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
    mode: 'HYBRID_SCRAPING',
    cacheSize: cache.size,
    message: 'Service Instagram avec scraping HTML'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Instagram HYBRIDE démarré sur le port ${PORT}`);
  console.log(`📱 Mode: SCRAPING HTML`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Test: http://localhost:${PORT}/api/test`);
});
