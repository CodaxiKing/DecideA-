import type { ImageSourcePropType } from 'react-native';

export type FoodCategory = 'caseira' | 'fastfood' | 'lanches' | 'massas' | 'japonesa' | 'sobremesas';
export type MealType = 'cafe' | 'almoco' | 'jantar' | 'lanche';
export type DietTag = 'vegetariano' | 'vegano' | 'sem-gluten' | 'sem-lactose';
export type Difficulty = 'Fácil' | 'Médio' | 'Difícil';

export interface RecipeIngredient {
  name: string;
  quantity: string;
  /** Chave normalizada usada para cruzar com "Tenho estes ingredientes". */
  key: string;
  /** Itens de despensa (sal, água, óleo) contam como disponíveis. */
  pantry?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  image?: ImageSourcePropType;
  imageAlt?: string;
  minutes: number;
  difficulty: Difficulty;
  servings: number;
  categories: FoodCategory[];
  meals: MealType[];
  diets: DietTag[];
  ingredients: RecipeIngredient[];
  steps: string[];
}

export const categoryLabels: Record<FoodCategory, string> = {
  caseira: 'Comida caseira',
  fastfood: 'Fast-food',
  lanches: 'Lanches',
  massas: 'Massas',
  japonesa: 'Comida japonesa',
  sobremesas: 'Sobremesas',
};

export const mealLabels: Record<MealType, string> = {
  cafe: 'Café',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
};

export const dietLabels: Record<DietTag, string> = {
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
  'sem-gluten': 'Sem glúten',
  'sem-lactose': 'Sem lactose',
};
