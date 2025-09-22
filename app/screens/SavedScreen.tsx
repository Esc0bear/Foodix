import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecipesStore } from '../store/useRecipesStore';
import { RecipeFilters, Recipe } from '../types/recipe';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/gluestack-theme';

/**
 * Écran des recettes sauvegardées avec design moderne cohérent
 */
export default function SavedScreen() {
  const { recipes, removeRecipe, getFilteredRecipes } = useRecipesStore();
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigation = useNavigation();

  // Initialiser les recettes filtrées au chargement et quand les recettes changent
  useEffect(() => {
    const filters: RecipeFilters = {
      search: searchText.trim() || undefined,
      platform: selectedCategory === 'All' ? undefined : 'instagram',
    };
    const filtered = getFilteredRecipes(filters);
    setFilteredRecipes(filtered);
  }, [recipes, searchText, selectedCategory, getFilteredRecipes]);

  // Gérer la navigation vers les détails
  const handleRecipePress = (recipeId: string) => {
    (navigation as any).navigate('RecipeDetail', { recipeId });
  };

  // Gérer la suppression
  const handleDeletePress = (recipeId: string) => {
    Alert.alert(
      'Supprimer la recette',
      'Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeRecipe(recipeId) },
      ]
    );
  };

  // Rendu d'une recette avec style moderne
  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity 
      style={styles.recipeCard} 
      onPress={() => handleRecipePress(item.id)}
    >
      {item.source.thumbnail && (
        <Image source={{ uri: item.source.thumbnail }} style={styles.recipeImage} />
      )}
      
      <View style={styles.recipeContent}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle} numberOfLines={2}>{item.title}</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item.id)}
          >
            <View style={styles.deleteIconContainer}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.recipeDetails}>
          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.detailIcon, { color: '#1976D2' }]}>⏱️</Text>
            </View>
            <Text style={styles.detailText}>{item.time?.total || 0} min</Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: '#E8F5E8' }]}>
              <Text style={[styles.detailIcon, { color: '#4CAF50' }]}>👥</Text>
            </View>
            <Text style={styles.detailText}>{item.servings || 1} pers.</Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.detailIcon, { color: '#FF9800' }]}>🔥</Text>
            </View>
            <Text style={styles.detailText}>{item.nutrition?.calories || 0} cal</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Rendu de l'état vide
  if (recipes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Recipes</Text>
          <Text style={styles.headerSubtitle}>Your recipe collection</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
          </View>
          <Text style={styles.emptyTitle}>No recipes saved yet</Text>
          <Text style={styles.emptyDescription}>
            Generate your first recipe from an Instagram post on the home screen
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fond violet très clair avec opacité */}
      <View style={styles.backgroundOverlay} />
      {/* Header moderne */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Recipes</Text>
        <Text style={styles.headerSubtitle}>Your recipe collection</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar avec style moderne */}
        <View style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor={colors.gray[400]}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Category Tabs avec style moderne */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryTabs}>
              {['All', 'Instagram', 'TikTok', 'YouTube'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category && styles.categoryTabActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryTabText,
                    selectedCategory === category && styles.categoryTabTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Create Category Button avec style moderne */}
        <TouchableOpacity style={styles.createCategoryCard}>
          <View style={styles.createCategoryIconContainer}>
            <Text style={styles.createCategoryIcon}>+</Text>
          </View>
          <Text style={styles.createCategoryText}>Create your first category</Text>
        </TouchableOpacity>

        {/* Recipes List */}
        <View style={styles.recipesSection}>
          <Text style={styles.recipesSectionTitle}>
            {filteredRecipes.length} {filteredRecipes.length === 1 ? 'Recipe' : 'Recipes'}
          </Text>
          <FlatList
            data={filteredRecipes}
            keyExtractor={(item: Recipe) => item.id}
            renderItem={renderRecipe}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
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
  // Header moderne
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    fontWeight: typography.weights.normal,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  // Search Card
  searchCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    color: '#1976D2',
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.black,
    fontWeight: typography.weights.medium,
  },
  // Category Card
  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  categoryTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.md,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryTab: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  categoryTabActive: {
    backgroundColor: colors.primary[700],
    borderColor: colors.primary[700],
  },
  categoryTabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray[700],
  },
  categoryTabTextActive: {
    color: colors.white,
  },
  // Create Category Card
  createCategoryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  createCategoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  createCategoryIcon: {
    fontSize: 16,
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  createCategoryText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primary[700],
  },
  // Recipes Section
  recipesSection: {
    marginBottom: spacing.xl,
  },
  recipesSectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  // Recipe Card moderne
  recipeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray[100],
  },
  recipeContent: {
    padding: spacing.lg,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  recipeTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginRight: spacing.sm,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
    color: '#D32F2F',
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
    color: '#1976D2',
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});