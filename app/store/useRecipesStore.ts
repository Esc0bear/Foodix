import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, RecipeFilters, ReformulationType } from '../types/recipe';
// import { v4 as uuidv4 } from 'uuid';
import { reformulateRecipe } from '../services/api';

interface RecipesState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
}

interface RecipesActions {
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  removeRecipe: (id: string) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  getRecipe: (id: string) => Recipe | undefined;
  getFilteredRecipes: (filters: RecipeFilters) => Recipe[];
  loadRecipes: () => Promise<void>;
  saveRecipes: () => Promise<void>;
  reformulateRecipe: (recipeId: string, reformulationType: ReformulationType) => Promise<void>;
  clearError: () => void;
}

type RecipesStore = RecipesState & RecipesActions;

const STORAGE_KEY = '@recipes';

export const useRecipesStore = create<RecipesStore>((set, get) => ({
  // État initial
  recipes: [],
  isLoading: false,
  error: null,

  // Actions
  addRecipe: (recipeData) => {
    console.log('💾 [Store] Ajout d\'une nouvelle recette');
    console.log('📝 [Store] Données de la recette:', {
      title: recipeData.title,
      ingredientsCount: recipeData.ingredients.length,
      instructionsCount: recipeData.instructions.length,
      platform: recipeData.source.platform
    });
    
    const newRecipe: Recipe = {
      ...recipeData,
      // Utiliser l'ID de l'API si disponible, sinon générer un ID local
      id: recipeData.id || `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    console.log('🆔 [Store] ID généré pour la recette:', newRecipe.id);
    console.log('📅 [Store] Date de création:', newRecipe.createdAt);

    set((state) => {
      const updatedRecipes = [newRecipe, ...state.recipes];
      console.log('📊 [Store] Nombre total de recettes après ajout:', updatedRecipes.length);
      return {
        recipes: updatedRecipes,
        error: null,
      };
    });

    console.log('💾 [Store] Sauvegarde automatique...');
    // Sauvegarder automatiquement
    get().saveRecipes();
    console.log('✅ [Store] Recette ajoutée et sauvegardée avec succès');
  },

  removeRecipe: (id) => {
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== id),
      error: null,
    }));

    // Sauvegarder automatiquement
    get().saveRecipes();
  },

  updateRecipe: (id, updates) => {
    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === id ? { ...recipe, ...updates } : recipe
      ),
      error: null,
    }));

    // Sauvegarder automatiquement
    get().saveRecipes();
  },

  getRecipe: (id) => {
    return get().recipes.find((recipe) => recipe.id === id);
  },

  getFilteredRecipes: (filters) => {
    const { recipes } = get();
    let filtered = [...recipes];

    // Filtre par texte de recherche
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter((recipe) => {
        const titleMatch = recipe.title.toLowerCase().includes(searchLower);
        const ingredientMatch = recipe.ingredients.some((ingredient) =>
          ingredient.item.toLowerCase().includes(searchLower)
        );
        return titleMatch || ingredientMatch;
      });
    }

    // Filtre par difficulté
    if (filters.difficulty) {
      filtered = filtered.filter((recipe) => recipe.difficulty === filters.difficulty);
    }

    // Filtre par temps total
    if (filters.time && filters.time !== '>60') {
      const maxMinutes = parseInt(filters.time.replace('≤', ''));
      filtered = filtered.filter((recipe) => {
        const totalTime = recipe.time.total;
        return totalTime !== null && totalTime <= maxMinutes;
      });
    } else if (filters.time === '>60') {
      filtered = filtered.filter((recipe) => {
        const totalTime = recipe.time.total;
        return totalTime !== null && totalTime > 60;
      });
    }

    // Filtre par plateforme
    if (filters.platform) {
      filtered = filtered.filter((recipe) => recipe.source.platform === filters.platform);
    }

    return filtered;
  },

  loadRecipes: async () => {
    try {
      set({ isLoading: true, error: null });

      const storedRecipes = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedRecipes) {
        const parsedRecipes = JSON.parse(storedRecipes);
        set({ recipes: parsedRecipes, isLoading: false });
      } else {
        set({ recipes: [], isLoading: false });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
      set({ 
        error: 'Erreur lors du chargement des recettes', 
        isLoading: false 
      });
    }
  },

  saveRecipes: async () => {
    try {
      const { recipes } = get();
      console.log('💾 [Store] Sauvegarde des recettes en cours...');
      console.log('📊 [Store] Nombre de recettes à sauvegarder:', recipes.length);
      
      const recipesJson = JSON.stringify(recipes);
      console.log('📏 [Store] Taille des données JSON:', recipesJson.length, 'caractères');
      
      await AsyncStorage.setItem(STORAGE_KEY, recipesJson);
      console.log('✅ [Store] Recettes sauvegardées avec succès dans AsyncStorage');
    } catch (error) {
      console.error('❌ [Store] Erreur lors de la sauvegarde des recettes:', error);
      console.error('📊 [Store] Détails de l\'erreur:', {
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        name: error instanceof Error ? error.name : 'Unknown'
      });
      set({ error: 'Erreur lors de la sauvegarde des recettes' });
    }
  },

  reformulateRecipe: async (recipeId, reformulationType) => {
    console.log('✨ [Store] Début de la reformulation de recette');
    console.log('🆔 [Store] ID de la recette:', recipeId);
    console.log('🎨 [Store] Type de reformulation:', reformulationType);
    
    try {
      console.log('⏳ [Store] Mise à jour de l\'état de chargement...');
      set({ isLoading: true, error: null });

      console.log('🌐 [Store] Appel de l\'API de reformulation...');
      // Appeler l'API de reformulation
      const reformulatedRecipe = await reformulateRecipe(recipeId, reformulationType);
      console.log('✅ [Store] Recette reformulée reçue:', {
        id: reformulatedRecipe.id,
        title: reformulatedRecipe.title,
        ingredientsCount: reformulatedRecipe.ingredients.length,
        instructionsCount: reformulatedRecipe.instructions.length
      });
      
      console.log('🔄 [Store] Mise à jour de la recette dans le store...');
      // Mettre à jour la recette dans le store
      set((state) => {
        const updatedRecipes = state.recipes.map((recipe) =>
          recipe.id === recipeId ? reformulatedRecipe : recipe
        );
        console.log('📊 [Store] Nombre total de recettes après mise à jour:', updatedRecipes.length);
        return {
          recipes: updatedRecipes,
          isLoading: false,
          error: null,
        };
      });

      console.log('💾 [Store] Sauvegarde automatique...');
      // Sauvegarder automatiquement
      get().saveRecipes();
      console.log('✅ [Store] Reformulation terminée avec succès');
    } catch (error) {
      console.error('❌ [Store] Erreur lors de la reformulation:', error);
      console.error('📊 [Store] Détails de l\'erreur:', {
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la reformulation de la recette', 
        isLoading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
