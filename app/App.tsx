import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/Tabs';
import Toast from 'react-native-toast-message';
import { useRecipesStore } from './store/useRecipesStore';
import { 
  getInitialUrl, 
  setupLinkingListener, 
  processSharedLink, 
  showSharedLinkAlert 
} from './services/sharing';

/**
 * Composant principal de l'application Foodix
 * 
 * Fonctionnalités :
 * - Navigation avec onglets
 * - Thème moderne avec palette violette
 * - Toast pour les notifications
 * - Chargement automatique des recettes sauvegardées
 * - Gestion des liens partagés
 */
export default function App() {
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  // Charger les recettes sauvegardées au démarrage et configurer les liens partagés
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Charger les recettes sauvegardées
        await useRecipesStore.getState().loadRecipes();

        // Vérifier si l'app a été ouverte par un lien
        const initialUrl = await getInitialUrl();
        if (initialUrl) {
          setSharedUrl(initialUrl);
        }

        // Configurer l'écoute des liens entrants
        const subscription = setupLinkingListener((url) => {
          setSharedUrl(url);
        });

        console.log('Application Foodix initialisée');
        
        // Nettoyer l'abonnement au démontage
        return () => subscription?.remove();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'app:', error);
      }
    };

    initializeApp();
  }, []);

  // Gérer les liens partagés
  useEffect(() => {
    if (sharedUrl) {
      const linkData = processSharedLink(sharedUrl);
      
      if (linkData.isValid) {
        showSharedLinkAlert(
          sharedUrl,
          () => {
            // Pré-remplir l'URL dans l'écran d'accueil
            console.log('URL partagée à traiter:', sharedUrl);
            if ((global as any).prefillHomeUrl) {
              (global as any).prefillHomeUrl(sharedUrl);
            }
            setSharedUrl(null);
          },
          () => {
            setSharedUrl(null);
          }
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lien non supporté',
          text2: 'Cette URL n\'est pas compatible avec Foodix',
        });
        setSharedUrl(null);
      }
    }
  }, [sharedUrl]);

  return (
    <NavigationContainer>
      <RootNavigator />
      {/* Toast pour les notifications */}
      <Toast />
    </NavigationContainer>
  );
}
