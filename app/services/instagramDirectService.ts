/**
 * Service d'extraction Instagram DIRECT côté mobile
 * Utilise l'IP du téléphone au lieu du serveur Heroku pour éviter le blocage
 */

interface InstagramCaptionResponse {
  success: boolean;
  caption: string;
  docId: string;
  cached: boolean;
  url: string;
}

interface InstagramDirectResult {
  status: number;
  caption: string | null;
  docId: string;
  error?: string;
}

export class InstagramDirectService {
  // Doc IDs Instagram (identiques au serveur local)
  private static readonly DOC_IDS = [
    '10015901848480474',
    '8845758582119845',
    '7616867078352743'
  ];

  // Headers qui simulent un navigateur mobile
  private static readonly HEADERS = {
    'content-type': 'application/x-www-form-urlencoded',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
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
  };

  /**
   * Extrait le shortcode d'une URL Instagram
   */
  static extractShortcode(url: string): string | null {
    const regex = /instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Vérifie si une URL est une URL Instagram valide
   */
  static isValidInstagramUrl(url: string): boolean {
    return this.extractShortcode(url) !== null;
  }

  /**
   * Parse la caption depuis la réponse JSON Instagram
   */
  private static parseCaption(json: any): string | null {
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
  }

  /**
   * Récupère une caption avec un doc_id spécifique
   */
  private static async fetchCaptionWithDocId(shortcode: string, docId: string): Promise<InstagramDirectResult> {
    try {
      console.log(`🔍 [InstagramDirect] Tentative avec doc_id: ${docId}`);
      
      const variables = encodeURIComponent(JSON.stringify({ shortcode }));
      const body = `variables=${variables}&doc_id=${docId}`;
      
      const response = await fetch('https://www.instagram.com/api/graphql', {
        method: 'POST',
        headers: this.HEADERS,
        body
      });
      
      let responseText = '';
      let json = null;
      
      try {
        responseText = await response.text();
        
        // Vérifier si la réponse est du HTML (erreur)
        if (responseText.trim().startsWith('<')) {
          console.log(`❌ [InstagramDirect] Réponse HTML reçue pour doc_id ${docId}`);
          return {
            status: response.status,
            caption: null,
            docId,
            error: 'HTML response received'
          };
        }
        
        json = JSON.parse(responseText);
      } catch (e: any) {
        console.log(`❌ [InstagramDirect] Erreur parsing pour doc_id ${docId}:`, e.message);
        return {
          status: response.status,
          caption: null,
          docId,
          error: e.message
        };
      }
      
      const caption = this.parseCaption(json);
      
      return {
        status: response.status,
        caption,
        docId
      };
      
    } catch (error: any) {
      console.error(`❌ [InstagramDirect] Erreur réseau pour doc_id ${docId}:`, error);
      return {
        status: 0,
        caption: null,
        docId,
        error: error.message
      };
    }
  }

  /**
   * Récupère la caption avec fallback sur plusieurs doc_ids
   */
  private static async getCaptionWithFallback(shortcode: string): Promise<string | null> {
    console.log(`🔍 [InstagramDirect] Recherche caption pour shortcode: ${shortcode}`);
    
    for (const docId of this.DOC_IDS) {
      const result = await this.fetchCaptionWithDocId(shortcode, docId);
      
      if (result.caption && result.caption.trim().length > 0) {
        console.log(`✅ [InstagramDirect] Caption trouvée avec doc_id ${docId}`);
        return result.caption;
      }
      
      console.log(`⚠️ [InstagramDirect] doc_id ${docId} échoué:`, {
        status: result.status,
        error: result.error
      });
    }
    
    console.log(`❌ [InstagramDirect] Aucune caption trouvée après avoir testé ${this.DOC_IDS.length} doc_ids`);
    return null;
  }

  /**
   * Récupère la légende d'un post Instagram (interface publique)
   */
  static async getCaption(url: string): Promise<string> {
    console.log('📱 [InstagramDirect] Début extraction DIRECTE depuis le mobile');
    console.log('🔗 [InstagramDirect] URL Instagram:', url);

    try {
      const shortcode = this.extractShortcode(url);
      if (!shortcode) {
        throw new Error('URL Instagram invalide');
      }

      console.log('🆔 [InstagramDirect] Shortcode extrait:', shortcode);

      const caption = await this.getCaptionWithFallback(shortcode);
      
      if (!caption) {
        throw new Error('Impossible d\'extraire la légende de ce post');
      }

      console.log('✅ [InstagramDirect] Caption extraite avec succès:', {
        length: caption.length,
        preview: caption.substring(0, 100) + (caption.length > 100 ? '...' : '')
      });

      return caption;

    } catch (error) {
      console.error('❌ [InstagramDirect] Erreur lors de l\'extraction:', error);
      throw error;
    }
  }

  /**
   * Test de connexion (vérifie si Instagram est accessible)
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 [InstagramDirect] Test de connexion directe...');
      
      // Test simple vers Instagram
      const response = await fetch('https://www.instagram.com/', {
        method: 'HEAD',
        headers: {
          'user-agent': this.HEADERS['user-agent']
        }
      });

      const isOk = response.ok;
      console.log(`${isOk ? '✅' : '❌'} [InstagramDirect] Connexion Instagram:`, {
        status: response.status,
        accessible: isOk
      });

      return isOk;
    } catch (error) {
      console.error('❌ [InstagramDirect] Erreur de connexion:', error);
      return false;
    }
  }
}

export default InstagramDirectService;
