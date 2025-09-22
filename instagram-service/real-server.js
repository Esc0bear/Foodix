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

const PORT = Number(process.env.PORT || 3002);

// Doc ID Instagram valide (récupéré depuis la vraie requête)
const IG_DOC_ID = '9944009885649098';

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

// Récupération d'une légende avec le doc_id valide
async function fetchCaption(shortcode) {
  // Utiliser la même structure de variables que la vraie requête
  const variables = encodeURIComponent(JSON.stringify({ shortcode }));
  const body = `av=0&hl=fr&__d=www&__user=0&__a=1&__req=2&__hs=20353.HYP%3Ainstagram_web_pkg.2.1...0&dpr=2&__ccg=EXCELLENT&__rev=1027410180&__s=s7m0fa%3A5liw9c%3Ahqv4o6&__hsi=7552900716233146042&__dyn=7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJw5ux609vCwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swtUd8-U2zxe2GewGw9a361qw8Xxm16wa-0raazo7u3C2u2J0bS1LwTwKG0WE8oC1Iwqo5p0OwUQp1yU426V89F8uwm8jwhU6W1tyVrx60gm5oswFwtF85i5E&__csr=glggEtsp4ZcAhYPZZvCjYGAQGJaCGGlfJah5jGrjl4VvBCVubGmmr-5kq9y9pFaBGVAXDBDxqaiy9FGAytaHyd5iFzaAHAUqyUxAy7CyVomUKHAyKq5UWemm9jAgDzVUF2EGAe-K7oG5oumFemiqEkABAxi6oyVEiKbzUarCxvGqmazodU01n9VA3e06Dzbx5howb04Iw_jG58mS2q58mU08H8jgjHwc604d8Uxktox6ga82ryVA6E32wr8zwvE24Q1bwZw4ac0qKOw2uBgfS0f0w0XPw1H603020sG0fBypK0kG0676043o&__hsdp=l0JMP5j8Ibcogx6A14kMbEfUcU2HwhoC1Mo4imQ0Y8e8O2S15x10Re0O-2-0Io66qi8xu3a2C0Mo3aAw6KAw5vCw6dwe61ZwvVU3AwbS0C81O83pEE18E5m1fe1sG1Hwei15w&__hblp=0Rw8W1iwrE6y0L8hwro4Jy82pxpe485ycK2qEcEiKU5e5Udotwku2-iKq0E866pe8xu3a8xecwLw967Ed8rwlp983nyo3cAwIwhE3HCw8q0gq0Uoco4K8wtFUrxS0GE2Zw9y0sy1MxG1dEE3Ax62K1lz848Wxqi4o461ox20yVEaUjgC6o8p8&__comet_req=7&lsd=AdG9536LRqU&jazoest=2807&__spin_r=1027410180&__spin_b=trunk&__spin_t=1758546735&__crn=comet.igweb.PolarisLoggedOutDesktopPostRouteNext&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=fetchPolarisLoggedOutExperimentQuery&variables=${variables}&server_timestamps=true&doc_id=${IG_DOC_ID}`;
  
  console.log(`🔍 Tentative d'extraction pour shortcode: ${shortcode}`);
  
  try {
    const response = await fetch('https://www.instagram.com/api/graphql', {
      method: 'POST',
      headers: { 
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,fr;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://www.instagram.com',
        'priority': 'u=1, i',
        'referer': `https://www.instagram.com/p/${shortcode}/?hl=fr`,
        'sec-ch-prefers-color-scheme': 'dark',
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'sec-ch-ua-full-version-list': '"Not;A=Brand";v="99.0.0.0", "Google Chrome";v="139.0.7258.139", "Chromium";v="139.0.7258.139"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': '"macOS"',
        'sec-ch-ua-platform-version': '"15.6.0"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'x-asbd-id': '359341',
        'x-csrftoken': 'ShXD5R7qFcDVlrdewE2Xwld45m1foRiA',
        'x-fb-friendly-name': 'fetchPolarisLoggedOutExperimentQuery',
        'x-fb-lsd': 'AdG9536LRqU',
        'x-ig-app-id': '936619743392459',
        'cookie': 'datr=IopiaDIM7eHsIZXvgslxlX75; ig_did=21948A7C-4110-4FA9-ACDA-E21FCCF800F0; mid=aGKKIgAEAAF2GfOHUpqy3V7kaXcl; csrftoken=ShXD5R7qFcDVlrdewE2Xwld45m1foRiA; wd=889x778'
      },
      body
    });
    
    console.log(`📡 Réponse reçue: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    // Vérifier si la réponse est du HTML (erreur)
    if (responseText.trim().startsWith('<')) {
      console.log(`❌ Réponse HTML reçue (probablement une erreur)`);
      console.log(`📄 Première partie de la réponse:`, responseText.substring(0, 200));
      return { 
        status: response.status, 
        caption: null,
        error: 'HTML response received'
      };
    }
    
    const json = JSON.parse(responseText);
    const caption = parseCaption(json);
    
    if (caption) {
      console.log(`✅ Légende trouvée: ${caption.length} caractères`);
    } else {
      console.log(`❌ Aucune légende trouvée dans la réponse JSON`);
      console.log(`📄 Structure de la réponse:`, JSON.stringify(json, null, 2).substring(0, 500));
    }
    
    return { 
      status: response.status, 
      caption: caption,
      docId: IG_DOC_ID
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
    mode: 'REAL',
    docId: IG_DOC_ID,
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
        url: url,
        mode: 'REAL'
      });
    }
    
    // Récupérer la légende
    const result = await fetchCaption(shortcode);
    
    if (!result.caption) {
      return res.status(404).json({ 
        error: 'Légende non trouvée',
        url: url,
        mode: 'REAL'
      });
    }
    
    // Mettre en cache
    cache.set(cacheKey, { caption: result.caption, docId: result.docId });
    
    res.json({
      success: true,
      caption: result.caption,
      docId: result.docId,
      cached: false,
      url: url,
      mode: 'REAL'
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
    mode: 'REAL',
    docId: IG_DOC_ID,
    cacheSize: cache.size,
    message: 'Service Instagram avec vraies données'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Instagram RÉEL démarré sur le port ${PORT}`);
  console.log(`📱 Mode: VRAIES DONNÉES`);
  console.log(`🎯 Doc ID: ${IG_DOC_ID}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Test: http://localhost:${PORT}/api/test`);
});
