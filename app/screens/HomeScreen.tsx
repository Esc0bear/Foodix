import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Clipboard,
} from 'react-native';
// import { LinkIcon, InstagramIcon } from '@gluestack-ui/icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useRecipesStore } from '../store/useRecipesStore';
import { fetchInstagramOEmbed } from '../services/oembed';
import { fetchInstagramData } from '../services/instagramGraphQL';
import { generateRecipe } from '../services/api';
import { RecipeGenerationPayload } from '../types/recipe';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/gluestack-theme';
import { processSharedLink } from '../services/sharing';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { RecipeLoadingScreen } from './RecipeLoadingScreen';

/**
 * Écran d'accueil pour générer des recettes à partir d'URLs Instagram
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oEmbedData, setOEmbedData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [generatedRecipeId, setGeneratedRecipeId] = useState<string | null>(null);
  const addRecipe = useRecipesStore((state) => state.addRecipe);

  // Fonction pour pré-remplir l'URL (appelée depuis App.tsx)
  const prefillUrl = (sharedUrl: string) => {
    const linkData = processSharedLink(sharedUrl);
    if (linkData.isValid) {
      setUrl(sharedUrl);
      Toast.show({
        type: 'success',
        text1: 'URL détectée',
        text2: `Lien ${linkData.platform} ajouté automatiquement`,
      });
    }
  };

  // Exposer la fonction globalement pour l'App.tsx
  React.useEffect(() => {
    (global as any).prefillHomeUrl = prefillUrl;
    return () => {
      delete (global as any).prefillHomeUrl;
    };
  }, []);

  // Charger les recettes au démarrage
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        await useRecipesStore.getState().loadRecipes();
      } catch (error) {
        console.error('Erreur lors du chargement des recettes:', error);
      }
    };
    
    loadRecipes();
  }, []);

  // Valider l'URL Instagram
  const isValidInstagramUrl = (url: string): boolean => {
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;
    return instagramRegex.test(url);
  };

  // Traiter l'input (URL ou description)
  const processInput = async () => {
    console.log('🚀 [HomeScreen] Début du processus de génération de recette');
    console.log('📝 [HomeScreen] URL/Description saisie:', url.trim());
    
    if (!url.trim()) {
      console.log('❌ [HomeScreen] Erreur: URL/description vide');
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez saisir une URL Instagram ou une description de recette',
      });
      return;
    }

    console.log('⏳ [HomeScreen] Démarrage du chargement...');
    setIsLoading(true);
    
    try {
      // Vérifier si c'est une URL Instagram
      const isInstagramUrl = isValidInstagramUrl(url.trim());
      console.log('🔍 [HomeScreen] Type d\'input détecté:', isInstagramUrl ? 'URL Instagram' : 'Description de recette');
      
      if (isInstagramUrl) {
        console.log('📱 [HomeScreen] Cas 1: URL Instagram détectée, récupération des données...');
        
        try {
          // Essayer d'abord le service Instagram GraphQL (nouveau)
          console.log('🆕 [HomeScreen] Tentative avec le service Instagram GraphQL...');
          const instagramData = await fetchInstagramData(url.trim());
          console.log('✅ [HomeScreen] Données Instagram récupérées via GraphQL:', {
            title: instagramData.title,
            author: instagramData.author_name,
            captionLength: instagramData.caption?.length || 0
          });
          
          setOEmbedData(instagramData);
          setShowPreview(true);
          console.log('👀 [HomeScreen] Aperçu affiché, en attente de confirmation utilisateur');
          
          Toast.show({
            type: 'success',
            text1: 'Aperçu chargé',
            text2: 'Les données du post Instagram ont été extraites.',
          });
        } catch (graphqlError) {
          console.log('⚠️ [HomeScreen] Service GraphQL échoué, fallback vers oEmbed...', graphqlError.message);
          
          // Fallback vers oEmbed si le service GraphQL échoue
          const oEmbedResponse = await fetchInstagramOEmbed(url.trim());
          console.log('✅ [HomeScreen] Données oEmbed récupérées (fallback):', {
            title: oEmbedResponse.title,
            author: oEmbedResponse.author_name,
            thumbnail: oEmbedResponse.thumbnail_url ? 'Présent' : 'Absent'
          });
          
          setOEmbedData(oEmbedResponse);
          setShowPreview(true);
          console.log('👀 [HomeScreen] Aperçu affiché (fallback), en attente de confirmation utilisateur');
          
          Toast.show({
            type: 'success',
            text1: 'Aperçu chargé',
            text2: 'Les données du post Instagram ont été extraites (mode fallback).',
          });
        }
      } else {
        console.log('📝 [HomeScreen] Cas 2: Description de recette, génération directe...');
        // Cas 2: Description de recette - générer directement la recette
        await generateRecipeFromDescription(url.trim());
      }
    } catch (err: any) {
      console.error('❌ [HomeScreen] Erreur lors du traitement:', err);
      console.error('📊 [HomeScreen] Détails de l\'erreur:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      Alert.alert('Erreur', err.message || 'Impossible de traiter votre demande.');
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: err.message || 'Veuillez réessayer.',
      });
    } finally {
      console.log('🏁 [HomeScreen] Fin du processus, arrêt du chargement');
      setIsLoading(false);
    }
  };

  // Générer une recette à partir d'une description de texte
  const generateRecipeFromDescription = async (description: string) => {
    console.log('📝 [HomeScreen] Génération de recette à partir de description');
    console.log('📄 [HomeScreen] Description:', description);
    
    try {
      // Étape 1: Analyse
      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondes

      const payload: RecipeGenerationPayload = {
        platform: 'instagram',
        url: 'https://instagram.com/description',
        author: 'Utilisateur',
        caption: description,
        thumbnail: null,
      };

      console.log('📦 [HomeScreen] Payload créé:', {
        platform: payload.platform,
        url: payload.url,
        author: payload.author,
        captionLength: payload.caption.length,
        thumbnail: payload.thumbnail
      });

      // Étape 2: Génération IA
      setLoadingStep(2);
      console.log('🌐 [HomeScreen] Appel de l\'API generateRecipe...');
      
      // Lancer l'API en parallèle avec un timer pour les étapes
      const apiPromise = generateRecipe(payload);
      const stepTimer = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < 3) return prev + 1;
          return prev;
        });
      }, 3000); // Changer d'étape toutes les 3 secondes
      
      const recipe = await apiPromise;
      clearInterval(stepTimer);
      console.log('✅ [HomeScreen] Recette générée avec succès:', {
        id: recipe.id,
        title: recipe.title,
        ingredientsCount: recipe.ingredients.length,
        instructionsCount: recipe.instructions.length
      });

      // Étape 3: Validation
      setLoadingStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde

      console.log('💾 [HomeScreen] Ajout de la recette au store...');
      addRecipe(recipe);
      console.log('✅ [HomeScreen] Recette ajoutée au store');

      // Étape 4: Finalisation
      setLoadingStep(4);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde

      // Stocker l'ID pour la navigation
      setGeneratedRecipeId(recipe.id);

      Toast.show({
        type: 'success',
        text1: 'Recette générée !',
        text2: 'Votre description a été transformée en recette',
      });

      console.log('🧭 [HomeScreen] Navigation vers RecipeDetail avec ID:', recipe.id);
      // Utiliser l'ID de l'API directement
      (navigation as any).navigate('RecipeDetail', { recipeId: recipe.id });
      setUrl('');
      console.log('🏁 [HomeScreen] Processus de génération terminé avec succès');
    } catch (err: any) {
      console.error('❌ [HomeScreen] Erreur lors de la génération de recette:', err);
      console.error('📊 [HomeScreen] Détails de l\'erreur:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      throw new Error(err.message || 'Impossible de générer la recette à partir de votre description.');
    }
  };

  // Générer la recette
  const generateRecipeFromData = async () => {
    console.log('📱 [HomeScreen] Génération de recette à partir des données oEmbed');
    
    if (!oEmbedData) {
      console.log('❌ [HomeScreen] Erreur: oEmbedData manquant');
      return;
    }

    console.log('📊 [HomeScreen] Données oEmbed disponibles:', {
      title: oEmbedData.title,
      author: oEmbedData.author_name,
      thumbnail: oEmbedData.thumbnail_url ? 'Présent' : 'Absent',
      url: url.trim()
    });

    try {
      console.log('⏳ [HomeScreen] Démarrage du chargement...');
      setIsLoading(true);

      // Nettoyer la légende pour éviter les erreurs JSON
      const cleanCaption = (oEmbedData.caption || oEmbedData.title || '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Supprimer les caractères de contrôle
        .replace(/\\/g, '\\\\') // Échapper les backslashes
        .replace(/"/g, '\\"') // Échapper les guillemets
        .replace(/\n/g, '\\n') // Échapper les retours à la ligne
        .replace(/\r/g, '\\r') // Échapper les retours chariot
        .replace(/\t/g, '\\t') // Échapper les tabulations
        .trim();

      const payload: RecipeGenerationPayload = {
        platform: 'instagram',
        url: url.trim(),
        author: oEmbedData.author_name,
        caption: cleanCaption,
        thumbnail: oEmbedData.thumbnail_url,
      };

      console.log('📦 [HomeScreen] Payload créé:', {
        platform: payload.platform,
        url: payload.url,
        author: payload.author,
        captionLength: payload.caption.length,
        captionPreview: payload.caption.substring(0, 100) + '...',
        thumbnail: payload.thumbnail ? 'Présent' : 'Absent'
      });

      console.log('🔍 [HomeScreen] Légende complète nettoyée:', payload.caption);

      console.log('🌐 [HomeScreen] Appel de l\'API generateRecipe...');
      const recipe = await generateRecipe(payload);
      console.log('✅ [HomeScreen] Recette générée avec succès:', {
        id: recipe.id,
        title: recipe.title,
        ingredientsCount: recipe.ingredients.length,
        instructionsCount: recipe.instructions.length
      });

      console.log('💾 [HomeScreen] Ajout de la recette au store...');
      addRecipe(recipe);
      console.log('✅ [HomeScreen] Recette ajoutée au store');
      
      console.log('🧹 [HomeScreen] Nettoyage de l\'état...');
      setShowPreview(false);
      setUrl('');
      setOEmbedData(null);
      console.log('✅ [HomeScreen] État nettoyé');
      
      Toast.show({
        type: 'success',
        text1: 'Recette générée !',
        text2: 'La recette a été ajoutée à votre collection',
      });

      console.log('🧭 [HomeScreen] Navigation vers RecipeDetail avec ID:', recipe.id);
      // Naviguer vers les détails de la recette
      (navigation as any).navigate('RecipeDetail', { recipeId: recipe.id });
      console.log('🏁 [HomeScreen] Processus de génération terminé avec succès');
      
    } catch (error) {
      console.error('❌ [HomeScreen] Erreur lors de la génération de recette:', error);
      console.error('📊 [HomeScreen] Détails de l\'erreur:', {
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      
      Toast.show({
        type: 'error',
        text1: 'Erreur de génération',
        text2: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      console.log('🏁 [HomeScreen] Fin du processus, arrêt du chargement');
      setIsLoading(false);
    }
  };

  // Fermer l'aperçu
  const closePreview = () => {
    setShowPreview(false);
    setOEmbedData(null);
  };

  // Fonction pour coller une URL depuis le presse-papiers
  const handlePasteUrl = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        setUrl(clipboardContent);
        Toast.show({
          type: 'success',
          text1: 'URL collée',
          text2: 'URL ajoutée depuis le presse-papiers',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Presse-papiers vide',
          text2: 'Aucune URL trouvée dans le presse-papiers',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'accéder au presse-papiers',
      });
    }
  };

  // Fonction pour créer une recette de test (mode développement)
  const createTestRecipe = () => {
    Alert.alert(
      'Mode Test',
      'Voulez-vous créer une recette de démonstration ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Créer', 
          onPress: () => {
            const testRecipe = {
              id: `test-${Date.now()}`,
              createdAt: new Date().toISOString(),
              title: 'Pasta Carbonara Classique',
              summary: 'Une délicieuse recette de pâtes carbonara traditionnelle italienne',
              servings: 4,
              time: { prep: 10, cook: 15, total: 25 },
              difficulty: 'medium' as const,
              ingredients: [
                { item: 'Pâtes spaghetti', quantity: 400, unit: 'g', notes: null },
                { item: 'Pancetta', quantity: 150, unit: 'g', notes: 'coupée en dés' },
                { item: 'Œufs', quantity: 4, unit: null, notes: 'jaunes seulement' },
                { item: 'Pecorino Romano', quantity: 100, unit: 'g', notes: 'râpé' },
                { item: 'Poivre noir', quantity: null, unit: null, notes: 'fraîchement moulu' },
                { item: 'Sel', quantity: null, unit: null, notes: 'au goût' }
              ],
              instructions: [
                { step: 1, text: 'Faites cuire les pâtes dans une grande casserole d\'eau bouillante salée selon les instructions du paquet.' },
                { step: 2, text: 'Pendant ce temps, faites revenir la pancetta dans une grande poêle jusqu\'à ce qu\'elle soit dorée et croustillante.' },
                { step: 3, text: 'Dans un bol, battez les jaunes d\'œufs avec le pecorino râpé et le poivre noir.' },
                { step: 4, text: 'Égouttez les pâtes et réservez un verre d\'eau de cuisson.' },
                { step: 5, text: 'Ajoutez les pâtes chaudes à la pancetta, puis retirez du feu.' },
                { step: 6, text: 'Versez le mélange œufs-fromage sur les pâtes en remuant rapidement. Ajoutez un peu d\'eau de cuisson si nécessaire.' },
                { step: 7, text: 'Servez immédiatement avec du pecorino râpé et du poivre noir.' }
              ],
              nutrition: { calories: 520, protein: 22, carbs: 65, fat: 18 },
              proTips: [
                'Ne jamais ajouter de crème à la carbonara authentique',
                'Les pâtes doivent être très chaudes pour cuire les œufs sans les faire coaguler',
                'Servez immédiatement pour éviter que les œufs coagulent'
              ],
              source: { 
                platform: 'instagram', 
                url: 'https://instagram.com/test', 
                author: 'Chef Italiano', 
                thumbnail: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400'
              }
            };

            addRecipe(testRecipe);
            Toast.show({
              type: 'success',
              text1: 'Recette de test créée !',
              text2: 'Une recette de démonstration a été ajoutée',
            });
            (navigation as any).navigate('RecipeDetail', { recipeId: testRecipe.id });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Fond violet très clair avec opacité */}
      <View style={styles.backgroundOverlay} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
      {/* Header moderne avec style cohérent */}
      <View style={styles.header}>
        <Text style={styles.title}>Foodix</Text>
        <Text style={styles.subtitle}>
          Transformez vos posts Instagram en recettes avec l'IA
        </Text>
        
        {/* Icône de l'assiette et des couverts */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🍽</Text>
        </View>
      </View>

      {/* Input section avec style moderne */}
      <View style={styles.formSection}>
        <View style={styles.inputCard}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Collez un lien Instagram ou décrivez votre recette..."
              placeholderTextColor={colors.gray[400]}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          <TouchableOpacity 
            style={styles.pasteButton}
            onPress={handlePasteUrl}
          >
            <Text style={styles.pasteIcon}>📋</Text>
          </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={createTestRecipe}
            >
              <Text style={styles.infoIcon}>🧪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Generate Recipe Button avec style moderne */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            url.trim() && styles.generateButtonActive,
            isLoading && styles.generateButtonDisabled
          ]}
          onPress={processInput}
          disabled={isLoading || !url.trim()}
        >
          <Text style={[styles.sparkleIcon, url.trim() && { color: colors.white }]}>✨</Text>
          <Text style={[
            styles.generateButtonText,
            url.trim() && styles.generateButtonTextActive
          ]}>
            {isLoading ? 'Génération...' : 'Créer la recette'}
          </Text>
          <Text style={[styles.sparkleIcon, url.trim() && { color: colors.white }]}>✨</Text>
        </TouchableOpacity>

        {/* Social Media Buttons avec style moderne */}
        <View style={styles.socialSection}>
          <TouchableOpacity style={styles.socialButton}>
            <View style={[styles.socialIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.socialIcon, { color: '#1976D2' }]}>📷</Text>
            </View>
            <Text style={styles.socialText}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <View style={[styles.socialIconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Text style={[styles.socialIcon, { color: '#7B1FA2' }]}>🎵</Text>
            </View>
            <Text style={styles.socialText}>TikTok</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={createTestRecipe}>
            <View style={[styles.socialIconContainer, { backgroundColor: '#E8F5E8' }]}>
              <Text style={[styles.socialIcon, { color: '#4CAF50' }]}>🧪</Text>
            </View>
            <Text style={styles.socialText}>Test</Text>
          </TouchableOpacity>
        </View>

        {/* Aperçu des données oEmbed */}
        {showPreview && oEmbedData && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Aperçu du post</Text>
              <TouchableOpacity onPress={closePreview} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewContent}>
              <Image
                source={{ uri: oEmbedData.thumbnail_url }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.previewText}>
                <Text style={styles.previewCaption} numberOfLines={2}>
                  {oEmbedData.title}
                </Text>
                <Text style={styles.previewAuthor}>
                  Par {oEmbedData.author_name}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.generateRecipeButton}
              onPress={generateRecipeFromData}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.generateRecipeButtonText}>Génération en cours...</Text>
                </View>
              ) : (
                <Text style={styles.generateRecipeButtonText}>Générer la recette</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

        {/* Footer text moderne */}
        <Text style={styles.footerText}>
          fait avec ❤️ pour les foodies gourmands
        </Text>
      </ScrollView>

      {/* Écran de chargement avec étapes */}
      <RecipeLoadingScreen 
        visible={isLoading} 
        currentStep={loadingStep}
        totalSteps={4}
        stepText="Traitement en cours..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  // Fond violet très clair avec opacité
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(168, 85, 247, 0.05)', // primary.500 avec 5% d'opacité
    zIndex: -1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.lg,
  },
  // Header moderne avec style cohérent
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    textAlign: 'center',
    fontWeight: typography.weights.normal,
    marginBottom: spacing.md,
  },
  // Icône container
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconText: {
    fontSize: 40,
    textAlign: 'center',
  },
  // Form section
  formSection: {
    marginBottom: spacing.xl,
  },
  // Input card avec style moderne
  inputCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.black,
    fontWeight: typography.weights.medium,
    paddingVertical: spacing.md,
    minHeight: 80,
    maxHeight: 120,
  },
  pasteButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  pasteIcon: {
    color: colors.white,
    fontSize: 16,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  infoIcon: {
    color: colors.gray[500],
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  // Generate button moderne
  generateButton: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  generateButtonActive: {
    backgroundColor: colors.primary[700],
  },
  generateButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
  sparkleIcon: {
    fontSize: 18,
    color: colors.primary[700],
    marginHorizontal: spacing.sm,
  },
  generateButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[600],
  },
  generateButtonTextActive: {
    color: colors.white,
  },
  // Social media buttons modernes
  socialSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  socialButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  socialIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  socialIcon: {
    fontSize: 16,
  },
  socialText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  // Preview card moderne
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.card,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  closeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  closeButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
  },
  previewContent: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
  },
  previewText: {
    flex: 1,
    justifyContent: 'center',
  },
  previewCaption: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  previewAuthor: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  generateRecipeButton: {
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  generateRecipeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  // Footer text moderne
  footerText: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    fontWeight: typography.weights.medium,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  // Loading states
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
