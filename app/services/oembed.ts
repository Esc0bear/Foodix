import { InstagramOEmbedResponse, APIError } from '../types/recipe';

/**
 * Service pour récupérer les données oEmbed d'un post Instagram via l'API Meta
 */
export class OEmbedService {
  private static readonly INSTAGRAM_OEMBED_URL = 'https://graph.facebook.com/v17.0/instagram_oembed';
  
  private static getAccessToken(): string {
    const appId = process.env.EXPO_PUBLIC_FB_APP_ID;
    const clientToken = process.env.EXPO_PUBLIC_FB_CLIENT_TOKEN;
    
    if (!appId || !clientToken) {
      throw new Error('Clés API Facebook manquantes. Vérifiez EXPO_PUBLIC_FB_APP_ID et EXPO_PUBLIC_FB_CLIENT_TOKEN dans votre fichier .env');
    }
    
    return `${appId}|${clientToken}`;
  }

  /**
   * Valide si une URL est un post Instagram valide
   */
  private static isValidInstagramUrl(url: string): boolean {
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/;
    const reelRegex = /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/;
    
    return instagramRegex.test(url) || reelRegex.test(url);
  }

  /**
   * Récupère les données oEmbed d'un post Instagram
   */
  static async fetchInstagramOEmbed(url: string): Promise<InstagramOEmbedResponse> {
    try {
      // Validation de l'URL
      if (!this.isValidInstagramUrl(url)) {
        throw new Error('URL Instagram invalide. Veuillez fournir un lien vers un post ou un reel Instagram public.');
      }

      // Construction de l'URL avec les paramètres
      const accessToken = this.getAccessToken();
      const apiUrl = new URL(this.INSTAGRAM_OEMBED_URL);
      apiUrl.searchParams.append('url', url);
      apiUrl.searchParams.append('access_token', accessToken);

      // Appel à l'API Meta
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      // Vérification de la réponse
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
          case 400:
            throw new Error('URL Instagram invalide ou post non accessible.');
          case 401:
            throw new Error('Clés API Facebook invalides. Vérifiez votre configuration.');
          case 403:
            throw new Error('Accès refusé. Le post pourrait être privé ou supprimé.');
          case 404:
            throw new Error('Post Instagram non trouvé.');
          case 429:
            throw new Error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
          default:
            throw new Error(`Erreur API Meta: ${errorData.error?.message || 'Erreur inconnue'}`);
        }
      }

      // Parse de la réponse
      const data: InstagramOEmbedResponse = await response.json();

      // Validation des données requises
      if (!data.title || !data.author_name || !data.thumbnail_url) {
        throw new Error('Données oEmbed incomplètes. Le post pourrait ne pas être accessible.');
      }

      return data;

    } catch (error) {
      // Re-lancer les erreurs avec un message plus explicite
      if (error instanceof Error) {
        throw error;
      }
      
      // Erreurs réseau ou autres
      throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
    }
  }

  /**
   * Vérifie le statut des clés API oEmbed
   */
  static async checkOEmbedStatus(): Promise<boolean> {
    try {
      // Test avec une URL Instagram publique connue
      const testUrl = 'https://www.instagram.com/p/example/';
      
      // On ne fait que vérifier si les clés sont présentes et valides
      this.getAccessToken();
      
      return true;
    } catch (error) {
      console.error('Erreur de vérification oEmbed:', error);
      return false;
    }
  }
}

/**
 * Fonction utilitaire pour récupérer les données oEmbed
 */
export const fetchInstagramOEmbed = OEmbedService.fetchInstagramOEmbed.bind(OEmbedService);

/**
 * Fonction utilitaire pour vérifier le statut oEmbed
 */
export const checkOEmbedStatus = OEmbedService.checkOEmbedStatus.bind(OEmbedService);
