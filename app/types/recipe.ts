import { z } from 'zod';

// Schéma pour les ingrédients
export const IngredientSchema = z.object({
  item: z.string(),
  quantity: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }).nullable(),
  unit: z.string().nullable(),
  notes: z.string().nullable(),
});

// Schéma pour les instructions
export const InstructionSchema = z.object({
  step: z.number(),
  text: z.string(),
});

// Schéma pour les informations temporelles
export const TimeSchema = z.object({
  prep: z.number().nullable(),
  cook: z.number().nullable(),
  total: z.number().nullable(),
});

// Schéma pour les informations nutritionnelles
export const NutritionSchema = z.object({
  calories: z.number().nullable(),
  protein: z.number().nullable(),
  carbs: z.number().nullable(),
  fat: z.number().nullable(),
});

// Schéma pour la source
export const SourceSchema = z.object({
  platform: z.literal('instagram'),
  url: z.string(),
  author: z.string().nullable(),
  thumbnail: z.string().nullable(),
});

// Schéma principal pour la recette
export const RecipeSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  servings: z.number().nullable(),
  time: TimeSchema,
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable(),
  ingredients: z.array(IngredientSchema),
  instructions: z.array(InstructionSchema),
  nutrition: NutritionSchema,
  proTips: z.array(z.string()),
  source: SourceSchema,
});

// Types TypeScript générés à partir des schémas Zod
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Instruction = z.infer<typeof InstructionSchema>;
export type Time = z.infer<typeof TimeSchema>;
export type Nutrition = z.infer<typeof NutritionSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;

// Types pour les filtres
export const DifficultyFilterSchema = z.enum(['easy', 'medium', 'hard']);
export const TimeFilterSchema = z.enum(['≤15', '≤30', '≤60', '>60']);
export const PlatformFilterSchema = z.enum(['instagram']);

export type DifficultyFilter = z.infer<typeof DifficultyFilterSchema>;
export type TimeFilter = z.infer<typeof TimeFilterSchema>;
export type PlatformFilter = z.infer<typeof PlatformFilterSchema>;

// Type pour les filtres combinés
export interface RecipeFilters {
  searchText?: string;
  difficulty?: DifficultyFilter;
  time?: TimeFilter;
  platform?: PlatformFilter;
}

// Type pour le payload envoyé au serveur Heroku
export interface RecipeGenerationPayload {
  platform: 'instagram';
  url: string;
  author: string | null;
  caption: string;
  thumbnail: string | null;
}

// Type pour la réponse de l'API oEmbed Meta
export interface InstagramOEmbedResponse {
  title: string;
  author_name: string;
  thumbnail_url: string;
  provider_url: string;
  provider_name: string;
  type: string;
  width: number;
  height: number;
  html: string;
}

// Types pour la reformulation de recettes
export type ReformulationType = 'simplify' | 'detailed' | 'professional' | 'casual';

export interface ReformulationPayload {
  recipeId: string;
  reformulationType: ReformulationType;
}

export interface ReformulationOptions {
  type: ReformulationType;
  label: string;
  description: string;
  icon: string;
}

// Type pour les erreurs d'API
export interface APIError {
  message: string;
  code?: string;
  status?: number;
}
