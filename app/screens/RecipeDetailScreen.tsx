import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRecipesStore } from '../store/useRecipesStore';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/gluestack-theme';
import { ReformulationType, ReformulationOptions } from '../types/recipe';
import Toast from 'react-native-toast-message';

/**
 * Écran de détails d'une recette (style ReelMeal)
 */
export default function RecipeDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { recipeId } = route.params as { recipeId: string };
  const recipes = useRecipesStore((state) => state.recipes);
  const reformulateRecipe = useRecipesStore((state) => state.reformulateRecipe);
  const isLoading = useRecipesStore((state) => state.isLoading);
  
  const [showReformulationModal, setShowReformulationModal] = useState(false);
  
  const recipe = recipes.find((r) => r.id === recipeId);

  // Options de reformulation
  const reformulationOptions: ReformulationOptions[] = [
    {
      type: 'simplify',
      label: 'Simplifier',
      description: 'Rendre la recette plus simple et accessible',
      icon: '🎯'
    },
    {
      type: 'detailed',
      label: 'Détailler',
      description: 'Ajouter plus de détails et d\'explications',
      icon: '📝'
    },
    {
      type: 'professional',
      label: 'Professionnel',
      description: 'Style de chef professionnel',
      icon: '👨‍🍳'
    },
    {
      type: 'casual',
      label: 'Décontracté',
      description: 'Ton plus familier et amical',
      icon: '😊'
    }
  ];

  const handleReformulation = async (reformulationType: ReformulationType) => {
    try {
      setShowReformulationModal(false);
      await reformulateRecipe(recipeId, reformulationType);
      
      Toast.show({
        type: 'success',
        text1: 'Recette reformulée !',
        text2: 'Votre recette a été mise à jour avec le nouveau style',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de reformulation',
        text2: error instanceof Error ? error.message : 'Impossible de reformuler la recette',
      });
    }
  };

  if (!recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Recette introuvable</Text>
          <Text style={styles.errorDescription}>
            Cette recette n'existe pas ou a été supprimée.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header avec image */}
      {recipe.source?.thumbnail && (
        <Image source={{ uri: recipe.source.thumbnail }} style={styles.heroImage} />
      )}
      
      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Titre et métadonnées */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            <TouchableOpacity 
              style={styles.reformulateButton}
              onPress={() => setShowReformulationModal(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.reformulateIcon}>✨</Text>
              )}
            </TouchableOpacity>
          </View>
          {recipe.summary && (
            <Text style={styles.summary}>{recipe.summary}</Text>
          )}
          
          {/* Métadonnées */}
          <View style={styles.metadata}>
            {recipe.time?.total && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataIcon}>⏱️</Text>
                <Text style={styles.metadataText}>{recipe.time.total} min</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataIcon}>👥</Text>
                <Text style={styles.metadataText}>{recipe.servings} portions</Text>
              </View>
            )}
            {recipe.difficulty && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataIcon}>⚡</Text>
                <Text style={styles.metadataText}>
                  {recipe.difficulty === 'easy' ? 'Facile' : 
                   recipe.difficulty === 'medium' ? 'Moyenne' : 'Difficile'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ingrédients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingrédients</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientBullet}>•</Text>
                <Text style={styles.ingredientText}>
                  {ingredient.quantity && ingredient.unit 
                    ? `${ingredient.quantity} ${ingredient.unit} ${ingredient.item}`
                    : ingredient.item}
                </Text>
                {ingredient.notes && (
                  <Text style={styles.ingredientNotes}>({ingredient.notes})</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionsList}>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{instruction.step}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Conseils de pro */}
        {recipe.proTips && recipe.proTips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conseils de pro</Text>
            <View style={styles.tipsList}>
              {recipe.proTips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Informations nutritionnelles */}
        {recipe.nutrition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations nutritionnelles</Text>
            <View style={styles.nutritionGrid}>
              {recipe.nutrition.calories && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
              )}
              {recipe.nutrition.protein && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protéines</Text>
                </View>
              )}
              {recipe.nutrition.carbs && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>Glucides</Text>
                </View>
              )}
              {recipe.nutrition.fat && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutrition.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Lipides</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Source */}
        {recipe.source && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Source</Text>
            <View style={styles.sourceCard}>
              <Text style={styles.sourcePlatform}>{recipe.source.platform}</Text>
              {recipe.source.author && (
                <Text style={styles.sourceAuthor}>Par {recipe.source.author}</Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Modal de reformulation */}
      <Modal
        visible={showReformulationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReformulationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reformuler la recette</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowReformulationModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Choisissez le style de reformulation pour votre recette
            </Text>
            
            <View style={styles.optionsList}>
              {reformulationOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={styles.optionItem}
                  onPress={() => handleReformulation(option.type)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  // Hero Image
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: colors.gray[100],
  },
  // Content
  content: {
    padding: spacing.lg,
  },
  // Header
  header: {
    marginBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.black,
    lineHeight: 36,
    flex: 1,
    marginRight: spacing.md,
  },
  reformulateButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  reformulateIcon: {
    fontSize: 20,
    color: colors.white,
  },
  summary: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  // Metadata
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  metadataIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  metadataText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary[700],
  },
  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  // Ingredients
  ingredientsList: {
    gap: spacing.sm,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  ingredientBullet: {
    fontSize: typography.sizes.lg,
    color: colors.primary[700],
    marginRight: spacing.sm,
    marginTop: 2,
  },
  ingredientText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.black,
    lineHeight: 22,
  },
  ingredientNotes: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    fontStyle: 'italic',
    marginLeft: spacing.xs,
  },
  // Instructions
  instructionsList: {
    gap: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  instructionNumberText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.black,
    lineHeight: 24,
  },
  // Tips
  tipsList: {
    gap: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[100],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.black,
    lineHeight: 22,
  },
  // Nutrition
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
  },
  // Source
  sourceCard: {
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sourcePlatform: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  sourceAuthor: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  // Error State
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: colors.primary[700],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
    fontWeight: typography.weights.bold,
  },
  modalDescription: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },
  optionArrow: {
    fontSize: typography.sizes.xl,
    color: colors.gray[400],
    fontWeight: typography.weights.bold,
  },
});