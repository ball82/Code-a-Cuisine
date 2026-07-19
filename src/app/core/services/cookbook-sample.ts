import { Recipe } from '../models/recipe';

/**
 * Lokale Beispiel-Rezepte für das Cookbook-Layout, solange keine Firebase-Config
 * hinterlegt ist (environment.firebase.projectId leer). Sobald die Config steht,
 * liest CookbookData stattdessen live aus Firestore. Vollständige Rezepte, damit
 * auch die Detailseite ohne Backend funktioniert.
 */
export const SAMPLE_RECIPES: Recipe[] = [
  {
    id: 'sample-italian-1',
    title: 'Pasta with spinach and cherry tomatoes',
    cuisine: 'italian',
    tags: ['vegetarian', 'quick'],
    cookingTimeMinutes: 20,
    portions: 2,
    cooks: 1,
    nutritionPerPortion: { calories: 630, protein: 18, fat: 24, carbs: 58 },
    yourIngredients: [
      { name: 'Pasta noodles', amount: 160, unit: 'gram' },
      { name: 'Cherry tomatoes', amount: 150, unit: 'gram' },
      { name: 'Spinach', amount: 100, unit: 'gram' }
    ],
    extraIngredients: [
      { name: 'Parmesan cheese', amount: 40, unit: 'gram' },
      { name: 'Garlic', amount: 2, unit: 'piece' }
    ],
    directions: [
      { step: 1, title: 'Cook the pasta', chef: 1, instruction: 'Boil the pasta in salted water until al dente, then drain.' },
      { step: 2, title: 'Make the sauce', chef: 1, instruction: 'Sauté garlic, add tomatoes and spinach, toss with pasta and parmesan.' }
    ],
    likes: 66,
    createdAt: '2026-06-13T22:26:48.441Z'
  },
  {
    id: 'sample-italian-2',
    title: 'Creamy mushroom risotto',
    cuisine: 'italian',
    tags: ['vegetarian', 'medium'],
    cookingTimeMinutes: 40,
    portions: 4,
    cooks: 2,
    nutritionPerPortion: { calories: 540, protein: 14, fat: 18, carbs: 72 },
    yourIngredients: [
      { name: 'Arborio rice', amount: 320, unit: 'gram' },
      { name: 'Mushrooms', amount: 250, unit: 'gram' }
    ],
    extraIngredients: [
      { name: 'Vegetable stock', amount: 1, unit: 'liter' },
      { name: 'White wine', amount: 100, unit: 'ml' }
    ],
    directions: [
      { step: 1, title: 'Prep the mushrooms', chef: 1, instruction: 'Clean and slice the mushrooms, then sauté them until golden and set aside.' },
      { step: 2, title: 'Warm the stock', chef: 2, parallel: true, instruction: 'While chef 1 preps the mushrooms, heat the vegetable stock and keep it gently simmering.' },
      { step: 3, title: 'Toast the rice', chef: 1, instruction: 'Toast the arborio rice in a little oil, then deglaze with the white wine.' },
      { step: 4, title: 'Add stock gradually', chef: 2, instruction: 'Ladle the warm stock into the rice while stirring until creamy, then fold in the mushrooms.' }
    ],
    likes: 48,
    createdAt: '2026-06-12T09:10:00.000Z'
  },
  {
    id: 'sample-german-1',
    title: 'Schnitzel with potato salad',
    cuisine: 'german',
    tags: ['keto', 'complex'],
    cookingTimeMinutes: 50,
    portions: 2,
    cooks: 1,
    nutritionPerPortion: { calories: 820, protein: 42, fat: 46, carbs: 55 },
    yourIngredients: [
      { name: 'Pork cutlet', amount: 300, unit: 'gram' },
      { name: 'Potatoes', amount: 400, unit: 'gram' }
    ],
    extraIngredients: [
      { name: 'Breadcrumbs', amount: 80, unit: 'gram' },
      { name: 'Egg', amount: 1, unit: 'piece' }
    ],
    directions: [
      { step: 1, title: 'Bread the cutlet', chef: 1, instruction: 'Coat cutlets in flour, egg and breadcrumbs, fry until golden.' },
      { step: 2, title: 'Prepare the salad', chef: 1, instruction: 'Boil and slice the potatoes, toss with dressing.' }
    ],
    likes: 41,
    createdAt: '2026-06-11T18:00:00.000Z'
  },
  {
    id: 'sample-japanese-1',
    title: 'Miso ramen with soft egg',
    cuisine: 'japanese',
    tags: ['medium'],
    cookingTimeMinutes: 35,
    portions: 2,
    cooks: 2,
    nutritionPerPortion: { calories: 610, protein: 26, fat: 20, carbs: 78 },
    yourIngredients: [
      { name: 'Ramen noodles', amount: 200, unit: 'gram' },
      { name: 'Egg', amount: 2, unit: 'piece' }
    ],
    extraIngredients: [
      { name: 'Miso paste', amount: 60, unit: 'gram' },
      { name: 'Spring onion', amount: 2, unit: 'piece' }
    ],
    directions: [
      { step: 1, title: 'Simmer the broth', chef: 1, instruction: 'Whisk miso into hot stock, keep warm.' },
      { step: 2, title: 'Assemble the bowls', chef: 2, instruction: 'Cook noodles, add broth, top with egg and onion.' }
    ],
    likes: 37,
    createdAt: '2026-06-10T12:30:00.000Z'
  },
  {
    id: 'sample-indian-1',
    title: 'Chickpea curry with rice',
    cuisine: 'indian',
    tags: ['vegan', 'medium'],
    cookingTimeMinutes: 35,
    portions: 4,
    cooks: 1,
    nutritionPerPortion: { calories: 480, protein: 16, fat: 12, carbs: 76 },
    yourIngredients: [
      { name: 'Chickpeas', amount: 400, unit: 'gram' },
      { name: 'Rice', amount: 300, unit: 'gram' }
    ],
    extraIngredients: [
      { name: 'Coconut milk', amount: 400, unit: 'ml' },
      { name: 'Curry paste', amount: 50, unit: 'gram' }
    ],
    directions: [
      { step: 1, title: 'Build the curry', chef: 1, instruction: 'Fry curry paste, add chickpeas and coconut milk, simmer.' },
      { step: 2, title: 'Cook the rice', chef: 1, instruction: 'Steam the rice and serve alongside the curry.' }
    ],
    likes: 33,
    createdAt: '2026-06-09T15:45:00.000Z'
  },
  {
    id: 'sample-gourmet-1',
    title: 'Seared salmon with beurre blanc',
    cuisine: 'gourmet',
    tags: ['keto', 'complex'],
    cookingTimeMinutes: 55,
    portions: 2,
    cooks: 2,
    nutritionPerPortion: { calories: 720, protein: 38, fat: 52, carbs: 8 },
    yourIngredients: [
      { name: 'Salmon fillet', amount: 300, unit: 'gram' },
      { name: 'Butter', amount: 120, unit: 'gram' }
    ],
    extraIngredients: [
      { name: 'Shallot', amount: 1, unit: 'piece' },
      { name: 'White wine', amount: 80, unit: 'ml' }
    ],
    directions: [
      { step: 1, title: 'Sear the salmon', chef: 1, instruction: 'Sear salmon skin-side down until crisp.' },
      { step: 2, title: 'Whisk the sauce', chef: 2, instruction: 'Reduce wine with shallot, whisk in cold butter.' }
    ],
    likes: 29,
    createdAt: '2026-06-08T20:15:00.000Z'
  },
  {
    id: 'sample-fusion-1',
    title: 'Korean-Mexican bulgogi tacos',
    cuisine: 'fusion',
    tags: ['medium'],
    cookingTimeMinutes: 40,
    portions: 3,
    cooks: 2,
    nutritionPerPortion: { calories: 560, protein: 30, fat: 22, carbs: 58 },
    yourIngredients: [
      { name: 'Beef strips', amount: 400, unit: 'gram' },
      { name: 'Tortillas', amount: 6, unit: 'piece' }
    ],
    extraIngredients: [
      { name: 'Soy sauce', amount: 60, unit: 'ml' },
      { name: 'Kimchi', amount: 120, unit: 'gram' }
    ],
    directions: [
      { step: 1, title: 'Marinate the beef', chef: 1, instruction: 'Marinate beef in soy and sear hot and fast.' },
      { step: 2, title: 'Fill the tacos', chef: 2, instruction: 'Warm tortillas, fill with beef and kimchi.' }
    ],
    likes: 24,
    createdAt: '2026-06-07T11:05:00.000Z'
  },
  {
    id: 'sample-italian-3',
    title: 'Margherita flatbread',
    cuisine: 'italian',
    tags: ['vegetarian', 'quick'],
    cookingTimeMinutes: 18,
    portions: 2,
    cooks: 1,
    nutritionPerPortion: { calories: 520, protein: 20, fat: 18, carbs: 66 },
    yourIngredients: [
      { name: 'Flatbread', amount: 2, unit: 'piece' },
      { name: 'Mozzarella', amount: 150, unit: 'gram' }
    ],
    extraIngredients: [{ name: 'Tomato sauce', amount: 120, unit: 'ml' }],
    directions: [
      { step: 1, title: 'Top the bread', chef: 1, instruction: 'Spread sauce, add mozzarella and basil.' },
      { step: 2, title: 'Bake', chef: 1, instruction: 'Bake until the cheese bubbles and edges crisp.' }
    ],
    likes: 19,
    createdAt: '2026-06-06T17:20:00.000Z'
  }
];
