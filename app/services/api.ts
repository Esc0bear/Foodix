import axios, { AxiosResponse } from 'axios';
import { Recipe, RecipeGenerationPayload, APIError } from '../types/recipe';
import { RecipeSchema } from '../types/recipe';

/**
 * Service pour les appels API vers le serveur Heroku (proxy OpenAI)
 */
export class APIService {
  private static readonly BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  private static getApiUrl(endpoint: string): string {
    if (!this.BASE_URL) {
      throw new Error('URL de base de l\'API manquante. Vérifiez EXPO_PUBLIC_API_BASE_URL dans votre fichier .env');
    }
    
    return `${this.BASE_URL}${endpoint}`;
  }

  /**
   * Génère une recette à partir des données Instagram via le serveur Heroku
   */
  static async generateRecipe(payload: RecipeGenerationPayload): Promise<Recipe> {
    console.log('🌐 [APIService] Début de la génération de recette');
    console.log('📦 [APIService] Payload reçu:', {
      platform: payload.platform,
      url: payload.url,
      author: payload.author,
      captionLength: payload.caption.length,
      thumbnail: payload.thumbnail ? 'Présent' : 'Absent'
    });
    
    try {
      if (!this.BASE_URL) {
        console.error('❌ [APIService] Erreur: URL de base manquante');
        throw new Error('Configuration API manquante. Vérifiez vos variables d\'environnement.');
      }

      const url = this.getApiUrl('/generate-recipe');
      console.log('🔗 [APIService] URL de l\'endpoint:', url);
      
      console.log('📡 [APIService] Envoi de la requête POST vers Heroku...');
      const startTime = Date.now();
      
      const response: AxiosResponse<Recipe> = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000, // 30 secondes de timeout
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('✅ [APIService] Réponse reçue du serveur Heroku:', {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        dataSize: JSON.stringify(response.data).length
      });

      console.log('🔍 [APIService] Validation de la réponse avec Zod...');
      // Validation de la réponse avec Zod
      const validatedRecipe = RecipeSchema.parse(response.data);
      console.log('✅ [APIService] Réponse validée avec succès:', {
        id: validatedRecipe.id,
        title: validatedRecipe.title,
        ingredientsCount: validatedRecipe.ingredients.length,
        instructionsCount: validatedRecipe.instructions.length
      });
      
      return validatedRecipe;

    } catch (error) {
      console.error('❌ [APIService] Erreur lors de la génération de recette:', error);
      
      if (axios.isAxiosError(error)) {
        console.log('🌐 [APIService] Erreur Axios détectée');
        // Erreurs axios spécifiques
        if (error.response) {
          // Erreur de réponse du serveur
          const status = error.response.status;
          const data = error.response.data as any;
          
          console.error('📡 [APIService] Erreur de réponse du serveur:', {
            status,
            statusText: error.response.statusText,
            data: data,
            headers: error.response.headers
          });
          
          switch (status) {
            case 400:
              console.error('❌ [APIService] Erreur 400: Données invalides');
              throw new Error('Données invalides envoyées au serveur.');
            case 401:
              console.error('❌ [APIService] Erreur 401: Authentification requise');
              throw new Error('Authentification requise.');
            case 403:
              console.error('❌ [APIService] Erreur 403: Accès refusé');
              throw new Error('Accès refusé au serveur.');
            case 404:
              console.error('❌ [APIService] Erreur 404: Endpoint non trouvé');
              throw new Error('Endpoint non trouvé.');
            case 429:
              console.error('❌ [APIService] Erreur 429: Limite de requêtes atteinte');
              throw new Error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
            case 500:
              console.error('❌ [APIService] Erreur 500: Erreur interne du serveur');
              throw new Error('Erreur interne du serveur.');
            case 502:
              console.error('❌ [APIService] Erreur 502: Serveur indisponible');
              throw new Error('Serveur temporairement indisponible.');
            case 503:
              console.error('❌ [APIService] Erreur 503: Service indisponible');
              throw new Error('Service temporairement indisponible.');
            default:
              console.error('❌ [APIService] Erreur serveur inconnue:', status);
              throw new Error(`Erreur serveur (${status}): ${data?.message || 'Erreur inconnue'}`);
          }
        } else if (error.request) {
          // Erreur de requête (pas de réponse)
          console.error('📡 [APIService] Erreur de requête (pas de réponse):', {
            message: error.message,
            code: error.code,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              timeout: error.config?.timeout
            }
          });
          throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
        } else {
          // Erreur de configuration
          console.error('⚙️ [APIService] Erreur de configuration:', error.message);
          throw new Error('Erreur de configuration de la requête.');
        }
      } else if (error instanceof Error) {
        // Erreurs de validation Zod ou autres
        console.error('🔍 [APIService] Erreur de validation ou autre:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        throw error;
      } else {
        // Erreurs inconnues
        console.error('❓ [APIService] Erreur inconnue:', error);
        throw new Error('Erreur inconnue lors de la génération de la recette.');
      }
    }
  }

  /**
   * Vérifie le statut du serveur Heroku
   */
  static async checkServerStatus(): Promise<boolean> {
    try {
      if (!this.BASE_URL) {
        return false;
      }

      const url = this.getApiUrl('/health');
      
      const response = await axios.get(url, {
        timeout: 5000, // 5 secondes de timeout pour le health check
      });

      return response.status === 200;

    } catch (error) {
      console.error('Erreur de vérification du serveur:', error);
      return false;
    }
  }

  /**
   * Teste la connexion au serveur OpenAI via le proxy
   */
  static async checkOpenAIStatus(): Promise<boolean> {
    try {
      if (!this.BASE_URL) {
        return false;
      }

      const url = this.getApiUrl('/test-openai');
      
      const response = await axios.get(url, {
        timeout: 10000, // 10 secondes de timeout pour le test OpenAI
      });

      return response.status === 200;

    } catch (error) {
      console.error('Erreur de vérification OpenAI:', error);
      return false;
    }
  }

  /**
   * Reformule une recette existante via le serveur Heroku
   */
  static async reformulateRecipe(recipeId: string, reformulationType: 'simplify' | 'detailed' | 'professional' | 'casual'): Promise<Recipe> {
    try {
      if (!this.BASE_URL) {
        throw new Error('Configuration API manquante. Vérifiez vos variables d\'environnement.');
      }

      const url = this.getApiUrl('/reformulate-recipe');
      
      const payload = {
        recipeId,
        reformulationType
      };
      
      const response: AxiosResponse<Recipe> = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000, // 30 secondes de timeout
      });

      // Validation de la réponse avec Zod
      const validatedRecipe = RecipeSchema.parse(response.data);
      
      return validatedRecipe;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Erreurs axios spécifiques
        if (error.response) {
          // Erreur de réponse du serveur
          const status = error.response.status;
          const data = error.response.data as any;
          
          switch (status) {
            case 400:
              throw new Error('Données invalides envoyées au serveur.');
            case 401:
              throw new Error('Authentification requise.');
            case 403:
              throw new Error('Accès refusé au serveur.');
            case 404:
              throw new Error('Recette non trouvée.');
            case 429:
              throw new Error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
            case 500:
              throw new Error('Erreur interne du serveur.');
            case 502:
              throw new Error('Serveur temporairement indisponible.');
            case 503:
              throw new Error('Service temporairement indisponible.');
            default:
              throw new Error(`Erreur serveur (${status}): ${data?.message || 'Erreur inconnue'}`);
          }
        } else if (error.request) {
          // Erreur de requête (pas de réponse)
          throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
        } else {
          // Erreur de configuration
          throw new Error('Erreur de configuration de la requête.');
        }
      } else if (error instanceof Error) {
        // Erreurs de validation Zod ou autres
        throw error;
      } else {
        // Erreurs inconnues
        throw new Error('Erreur inconnue lors de la reformulation de la recette.');
      }
    }
  }

  /**
   * Vérifie le statut global de l'API
   */
  static async checkAPIStatus(type: 'server' | 'openai'): Promise<boolean> {
    try {
      switch (type) {
        case 'server':
          return await this.checkServerStatus();
        case 'openai':
          return await this.checkOpenAIStatus();
        default:
          return false;
      }
    } catch (error) {
      console.error(`Erreur de vérification API (${type}):`, error);
      return false;
    }
  }
}

/**
 * Fonctions utilitaires pour les appels API
 */
export const generateRecipe = APIService.generateRecipe.bind(APIService);
export const reformulateRecipe = APIService.reformulateRecipe.bind(APIService);
export const checkServerStatus = APIService.checkServerStatus.bind(APIService);
export const checkOpenAIStatus = APIService.checkOpenAIStatus.bind(APIService);
export const checkAPIStatus = APIService.checkAPIStatus.bind(APIService);
