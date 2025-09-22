import axios from 'axios';

interface InstagramCaptionResponse {
  success: boolean;
  caption: string;
  docId: string;
  cached: boolean;
  url: string;
}

interface InstagramErrorResponse {
  error: string;
  message?: string;
  url?: string;
}

class InstagramService {
  private static BASE_URL = process.env.EXPO_PUBLIC_INSTAGRAM_SERVICE_URL || 'http://localhost:3004';

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
   * Récupère la légende d'un post Instagram
   */
  static async getCaption(url: string): Promise<string> {
    console.log('📱 [InstagramService] Début de l\'extraction de légende');
    console.log('🔗 [InstagramService] URL Instagram:', url);

    try {
      if (!this.BASE_URL) {
        console.error('❌ [InstagramService] URL du service Instagram manquante');
        throw new Error('Service Instagram non configuré');
      }

      const shortcode = this.extractShortcode(url);
      if (!shortcode) {
        console.error('❌ [InstagramService] URL Instagram invalide');
        throw new Error('URL Instagram invalide');
      }

      console.log('🆔 [InstagramService] Shortcode extrait:', shortcode);

      const apiUrl = `${this.BASE_URL}/api/caption`;
      console.log('🌐 [InstagramService] Appel de l\'API:', apiUrl);

      const response = await axios.get<InstagramCaptionResponse | InstagramErrorResponse>(apiUrl, {
        params: { url },
        timeout: 15000, // 15 secondes
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('📡 [InstagramService] Réponse reçue:', {
        status: response.status,
        success: 'success' in response.data ? response.data.success : false
      });

      if ('error' in response.data) {
        console.error('❌ [InstagramService] Erreur de l\'API:', response.data.error);
        throw new Error(response.data.error);
      }

      const data = response.data as InstagramCaptionResponse;
      
      if (!data.success || !data.caption) {
        console.error('❌ [InstagramService] Légende non trouvée');
        throw new Error('Légende non trouvée');
      }

      console.log('✅ [InstagramService] Légende extraite avec succès:', {
        length: data.caption.length,
        docId: data.docId,
        cached: data.cached
      });

      return data.caption;

    } catch (error) {
      console.error('❌ [InstagramService] Erreur lors de l\'extraction:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorData = error.response.data as InstagramErrorResponse;
          throw new Error(errorData.error || 'Erreur du service Instagram');
        } else if (error.request) {
          throw new Error('Impossible de joindre le service Instagram');
        }
      }
      
      throw error;
    }
  }

  /**
   * Teste la connexion au service Instagram
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 [InstagramService] Test de connexion...');
      
      const response = await axios.get(`${this.BASE_URL}/health`, {
        timeout: 5000,
      });

      console.log('✅ [InstagramService] Service disponible:', response.data);
      return true;
    } catch (error) {
      console.error('❌ [InstagramService] Service indisponible:', error);
      return false;
    }
  }
}

export default InstagramService;
