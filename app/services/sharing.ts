import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';

/**
 * Service pour gérer les liens partagés vers l'application Foodix
 */

// Types de liens supportés
export type SupportedPlatform = 'instagram' | 'tiktok' | 'facebook' | 'youtube';

export interface SharedLinkData {
  url: string;
  platform: SupportedPlatform;
  isValid: boolean;
}

/**
 * Vérifie si une URL est supportée par l'application
 */
export function isSupportedUrl(url: string): boolean {
  const supportedDomains = [
    'instagram.com',
    'www.instagram.com',
    'tiktok.com',
    'www.tiktok.com',
    'facebook.com',
    'www.facebook.com',
    'youtube.com',
    'www.youtube.com',
    'youtu.be'
  ];
  
  try {
    const urlObj = new URL(url);
    return supportedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Détermine la plateforme d'origine d'une URL
 */
export function detectPlatform(url: string): SupportedPlatform | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname.includes('instagram.com')) {
      return 'instagram';
    } else if (hostname.includes('tiktok.com')) {
      return 'tiktok';
    } else if (hostname.includes('facebook.com')) {
      return 'facebook';
    } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Traite un lien partagé et retourne les données extraites
 */
export function processSharedLink(url: string): SharedLinkData {
  const isValid = isSupportedUrl(url);
  const platform = detectPlatform(url);
  
  return {
    url,
    platform: platform || 'instagram', // Par défaut Instagram
    isValid
  };
}

/**
 * Obtient le lien initial qui a ouvert l'application
 */
export async function getInitialUrl(): Promise<string | null> {
  try {
    const url = await Linking.getInitialURL();
    return url;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL initiale:', error);
    return null;
  }
}

/**
 * Configure l'écoute des liens entrants
 */
export function setupLinkingListener(callback: (url: string) => void) {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });
  
  return subscription;
}

/**
 * Affiche une alerte de confirmation pour traiter un lien partagé
 */
export function showSharedLinkAlert(
  url: string, 
  onConfirm: () => void, 
  onCancel?: () => void
) {
  const platform = detectPlatform(url);
  const platformName = platform ? 
    (platform === 'instagram' ? 'Instagram' :
     platform === 'tiktok' ? 'TikTok' :
     platform === 'facebook' ? 'Facebook' :
     platform === 'youtube' ? 'YouTube' : 'réseau social') : 'réseau social';
  
  Alert.alert(
    'Lien partagé détecté',
    `Vous avez partagé un lien ${platformName} avec Foodix. Voulez-vous générer une recette à partir de ce contenu ?`,
    [
      {
        text: 'Annuler',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: 'Générer la recette',
        style: 'default',
        onPress: onConfirm
      }
    ]
  );
}

/**
 * Vérifie si l'application peut être ouverte par un lien
 */
export function canOpenUrl(url: string): Promise<boolean> {
  return Linking.canOpenURL(url);
}

/**
 * Ouvre une URL externe
 */
export function openUrl(url: string): Promise<boolean> {
  return Linking.openURL(url);
}

/**
 * Extrait l'URL du texte partagé (pour le partage de texte)
 */
export function extractUrlFromText(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  
  if (matches && matches.length > 0) {
    // Retourne la première URL trouvée
    return matches[0];
  }
  
  return null;
}

/**
 * Obtient les informations de partage depuis l'intent Android
 */
export async function getSharedText(): Promise<string | null> {
  if (Platform.OS === 'android') {
    try {
      // Pour Android, on peut utiliser expo-intent-launcher pour récupérer le texte partagé
      const { getIntent } = await import('expo-intent-launcher');
      // Note: Cette approche nécessite une configuration supplémentaire
      // Pour l'instant, on retourne null
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du texte partagé:', error);
      return null;
    }
  }
  
  return null;
}
