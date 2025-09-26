import InstagramService from './instagramService';
import InstagramDirectService from './instagramDirectService';
import { InstagramOEmbedResponse } from '../types/recipe';

/**
 * Service pour récupérer les données Instagram via GraphQL (sans oEmbed)
 * Utilise le service Instagram dédié pour extraire les légendes
 */
export class InstagramGraphQLService {
  /**
   * Valide si une URL est un post Instagram valide
   */
  private static isValidInstagramUrl(url: string): boolean {
    return InstagramDirectService.isValidInstagramUrl(url);
  }

  /**
   * Récupère les données d'un post Instagram via GraphQL
   */
  static async fetchInstagramData(url: string): Promise<InstagramOEmbedResponse> {
    try {
      console.log('📱 [InstagramGraphQL] Début de l\'extraction de données Instagram');
      console.log('🔗 [InstagramGraphQL] URL Instagram:', url);

      // Validation de l'URL
      if (!this.isValidInstagramUrl(url)) {
        throw new Error('URL Instagram invalide. Veuillez fournir un lien vers un post ou un reel Instagram public.');
      }

      // D'abord essayer l'extraction directe (IP du téléphone)
      console.log('🚀 [InstagramGraphQL] Tentative d\'extraction DIRECTE via IP mobile...');
      let caption: string;
      
      try {
        caption = await InstagramDirectService.getCaption(url);
        console.log('✅ [InstagramGraphQL] Extraction directe réussie !');
      } catch (directError: any) {
        console.log('⚠️ [InstagramGraphQL] Extraction directe échouée, fallback vers serveur...', directError.message);
        
        // Fallback vers le service serveur si l'extraction directe échoue
        const isServiceAvailable = await InstagramService.testConnection();
        if (!isServiceAvailable) {
          throw new Error('Service Instagram indisponible et extraction directe échouée. Veuillez réessayer plus tard.');
        }

        caption = await InstagramService.getCaption(url);
        console.log('✅ [InstagramGraphQL] Extraction via serveur réussie !');
      }
      
      if (!caption || caption.trim().length === 0) {
        throw new Error('Aucune légende trouvée pour ce post Instagram.');
      }

      // Extraire le shortcode pour construire les données
      const shortcode = InstagramDirectService.extractShortcode(url);
      if (!shortcode) {
        throw new Error('Impossible d\'extraire l\'identifiant du post.');
      }

      // Construire la réponse au format oEmbed
      const response: InstagramOEmbedResponse = {
        title: this.extractTitleFromCaption(caption),
        author_name: this.extractAuthorFromCaption(caption) || 'Instagram User',
        thumbnail_url: this.generateThumbnailUrl(shortcode),
        html: this.generateEmbedHtml(shortcode),
        width: 320,
        height: 400,
        type: 'rich',
        version: '1.0',
        provider_name: 'Instagram',
        provider_url: 'https://www.instagram.com',
        // Données supplémentaires
        caption: caption,
        shortcode: shortcode,
        url: url
      };

      console.log('✅ [InstagramGraphQL] Données extraites avec succès:', {
        title: response.title,
        author: response.author_name,
        captionLength: caption.length,
        shortcode: shortcode
      });

      return response;

    } catch (error) {
      console.error('❌ [InstagramGraphQL] Erreur lors de l\'extraction:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Erreur lors de l\'extraction des données Instagram.');
    }
  }

  /**
   * Extrait le titre de la légende (première ligne ou partie avant le premier saut de ligne)
   */
  private static extractTitleFromCaption(caption: string): string {
    // Décoder les entités HTML
    const decodedCaption = this.decodeHtmlEntities(caption);
    
    const lines = decodedCaption.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      return 'Post Instagram';
    }

    // Prendre la première ligne significative (plus de 3 caractères)
    const firstLine = lines.find(line => line.trim().length > 3);
    
    if (firstLine) {
      // Nettoyer et limiter à 100 caractères
      const cleaned = firstLine.trim()
        .replace(/[^\w\s\-.,!?àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/g, '')
        .substring(0, 100);
      return cleaned || 'Post Instagram';
    }

    return 'Post Instagram';
  }

  /**
   * Extrait l'auteur de la légende (recherche de patterns comme @username)
   */
  private static extractAuthorFromCaption(caption: string): string | null {
    // Décoder les entités HTML
    const decodedCaption = this.decodeHtmlEntities(caption);
    
    // Recherche de @username dans la légende
    const usernameMatch = decodedCaption.match(/@([a-zA-Z0-9._]+)/);
    if (usernameMatch) {
      return usernameMatch[1];
    }

    // Recherche de patterns Instagram spécifiques
    const instagramPatterns = [
      /(\w+)\s+le\s+\w+\s+\d+,\s+\d+:/i, // "louloukitchen_ le September 9, 2025:"
      /(\w+)\s+on\s+\w+\s+\d+,\s+\d+:/i, // "username on September 9, 2025:"
      /(\w+)\s+le\s+\d+\s+\w+\s+\d+:/i,  // "username le 9 September 2025:"
    ];

    for (const pattern of instagramPatterns) {
      const match = decodedCaption.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Recherche d'autres patterns d'auteur
    const authorPatterns = [
      /Par\s+([a-zA-Z0-9._\s]+)/i,
      /De\s+([a-zA-Z0-9._\s]+)/i,
      /By\s+([a-zA-Z0-9._\s]+)/i
    ];

    for (const pattern of authorPatterns) {
      const match = decodedCaption.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Génère une URL de thumbnail basée sur le shortcode
   */
  private static generateThumbnailUrl(shortcode: string): string {
    // URL de thumbnail Instagram standard
    return `https://instagram.com/p/${shortcode}/media/?size=m`;
  }

  /**
   * Génère le HTML d'embed basé sur le shortcode
   */
  private static generateEmbedHtml(shortcode: string): string {
    return `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${shortcode}/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a href="https://www.instagram.com/p/${shortcode}/" style="background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank"> <div style="display: flex; flex-direction: row; align-items: center;"> <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;"></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center;"> <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;"></div> <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;"></div></div></div><div style="padding: 19% 0;"></div> <div style="display:block; height:50px; margin:0 auto 12px; width:50px;"><svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="https://www.w3.org/2000/svg" xmlns:xlink="https://www.w3.org/1999/xlink"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-511.000000, -20.000000)" fill="#000000"><g><path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path></g></g></g></svg></div><div style="padding-top: 8px;"> <div style="color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;">Voir cette publication sur Instagram</div></div><div style="padding: 12.5% 0;"></div> <div style="display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;"><div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);"></div> <div style="background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;"></div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);"></div></div><div style="margin-left: 8px;"> <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;"></div> <div style="width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)"></div></div><div style="margin-left: auto;"> <div style="width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);"></div> <div style="background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);"></div> <div style="width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);"></div></div></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center; margin-bottom: 24px;"> <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 224px;"></div> <div style="background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 144px;"></div></div></a><p style="color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;"><a href="https://www.instagram.com/p/${shortcode}/" style="color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none;" target="_blank">Post Instagram</a></p></div></blockquote>`;
  }

  /**
   * Décode les entités HTML communes
   */
  private static decodeHtmlEntities(text: string): string {
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '=',
      '&#xa0;': ' ',
      '&#xe9;': 'é',
      '&#xe8;': 'è',
      '&#xe7;': 'ç',
      '&#xe0;': 'à',
      '&#xe2;': 'â',
      '&#xea;': 'ê',
      '&#xeb;': 'ë',
      '&#xee;': 'î',
      '&#xef;': 'ï',
      '&#xf4;': 'ô',
      '&#xf6;': 'ö',
      '&#xf9;': 'ù',
      '&#xfb;': 'û',
      '&#xfc;': 'ü',
      '&#xff;': 'ÿ',
    };

    return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  /**
   * Vérifie le statut du service Instagram GraphQL
   */
  static async checkServiceStatus(): Promise<boolean> {
    try {
      // Test de l'extraction directe en priorité
      const directStatus = await InstagramDirectService.testConnection();
      if (directStatus) {
        return true;
      }
      
      // Fallback vers le service serveur
      return await InstagramService.testConnection();
    } catch (error) {
      console.error('Erreur de vérification du service Instagram:', error);
      return false;
    }
  }
}

/**
 * Fonction utilitaire pour récupérer les données Instagram
 */
export const fetchInstagramData = InstagramGraphQLService.fetchInstagramData.bind(InstagramGraphQLService);

/**
 * Fonction utilitaire pour vérifier le statut du service
 */
export const checkInstagramServiceStatus = InstagramGraphQLService.checkServiceStatus.bind(InstagramGraphQLService);
