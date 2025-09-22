import { Recipe, DifficultyFilter, TimeFilter } from '../types/recipe';

/**
 * Utilitaires de formatage pour l'affichage des recettes
 */

/**
 * Formate le temps en minutes vers un texte lisible
 */
export const formatTime = (minutes: number | null): string => {
  if (minutes === null) return 'Non spécifié';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Formate le niveau de difficulté
 */
export const formatDifficulty = (difficulty: string | null): string => {
  switch (difficulty) {
    case 'easy':
      return 'Facile';
    case 'medium':
      return 'Moyen';
    case 'hard':
      return 'Difficile';
    default:
      return 'Non spécifié';
  }
};

/**
 * Formate le nombre de portions
 */
export const formatServings = (servings: number | null): string => {
  if (servings === null) return 'Non spécifié';
  
  return servings === 1 ? '1 portion' : `${servings} portions`;
};

/**
 * Formate les informations nutritionnelles
 */
export const formatNutrition = (nutrition: {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}): string => {
  const parts: string[] = [];
  
  if (nutrition.calories !== null) {
    parts.push(`${nutrition.calories} cal`);
  }
  
  if (nutrition.protein !== null) {
    parts.push(`${nutrition.protein}g protéines`);
  }
  
  if (nutrition.carbs !== null) {
    parts.push(`${nutrition.carbs}g glucides`);
  }
  
  if (nutrition.fat !== null) {
    parts.push(`${nutrition.fat}g lipides`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Non spécifié';
};

/**
 * Formate une quantité d'ingrédient
 */
export const formatIngredientQuantity = (
  quantity: number | null,
  unit: string | null
): string => {
  if (quantity === null) return '';
  
  let formatted = quantity.toString();
  
  if (unit) {
    formatted += ` ${unit}`;
  }
  
  return formatted;
};

/**
 * Tronque un texte à une longueur donnée
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Formate une date ISO vers un texte lisible
 */
export const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch (error) {
    return 'Date inconnue';
  }
};

/**
 * Obtient la couleur associée à un niveau de difficulté
 */
export const getDifficultyColor = (difficulty: string | null): string => {
  switch (difficulty) {
    case 'easy':
      return '#10B981'; // vert
    case 'medium':
      return '#F59E0B'; // orange
    case 'hard':
      return '#EF4444'; // rouge
    default:
      return '#6B7280'; // gris
  }
};

/**
 * Obtient l'icône associée à un niveau de difficulté
 */
export const getDifficultyIcon = (difficulty: string | null): string => {
  switch (difficulty) {
    case 'easy':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'hard':
      return '🔴';
    default:
      return '⚪';
  }
};

/**
 * Calcule le temps total estimé d'une recette
 */
export const calculateTotalTime = (recipe: Recipe): number | null => {
  const { time } = recipe;
  
  // Si le temps total est déjà spécifié, l'utiliser
  if (time.total !== null) {
    return time.total;
  }
  
  // Sinon, calculer à partir de prep + cook
  if (time.prep !== null && time.cook !== null) {
    return time.prep + time.cook;
  }
  
  return null;
};

/**
 * Vérifie si une recette correspond à un filtre de temps
 */
export const matchesTimeFilter = (recipe: Recipe, filter: TimeFilter): boolean => {
  const totalTime = calculateTotalTime(recipe);
  
  if (totalTime === null) return false;
  
  switch (filter) {
    case '≤15':
      return totalTime <= 15;
    case '≤30':
      return totalTime <= 30;
    case '≤60':
      return totalTime <= 60;
    case '>60':
      return totalTime > 60;
    default:
      return true;
  }
};

/**
 * Obtient le texte du filtre de temps
 */
export const getTimeFilterText = (filter: TimeFilter): string => {
  switch (filter) {
    case '≤15':
      return '≤ 15 min';
    case '≤30':
      return '≤ 30 min';
    case '≤60':
      return '≤ 60 min';
    case '>60':
      return '> 60 min';
    default:
      return 'Tous';
  }
};
