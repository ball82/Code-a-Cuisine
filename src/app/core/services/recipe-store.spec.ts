import { TestBed } from '@angular/core/testing';

import { RecipeStore } from './recipe-store';
import { Recipe } from '../models/recipe';

/** Minimales, gültiges Recipe für die Tests. */
function makeRecipe(id: string, likes = 0): Recipe {
  return {
    id,
    title: `Recipe ${id}`,
    cuisine: 'italian',
    tags: ['quick'],
    cookingTimeMinutes: 20,
    portions: 2,
    cooks: 1,
    nutritionPerPortion: { calories: 500, protein: 20, fat: 15, carbs: 60 },
    yourIngredients: [{ name: 'Pasta', amount: 100, unit: 'gram' }],
    extraIngredients: [],
    directions: [{ step: 1, title: 'Cook', chef: 1, instruction: 'Boil.' }],
    likes,
    createdAt: '2026-07-01T00:00:00.000Z'
  };
}

describe('RecipeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('stores generated recipes and finds them by id', () => {
    const store = TestBed.inject(RecipeStore);
    const recipe = makeRecipe('a');
    store.setGenerated([recipe]);

    expect(store.generated()).toEqual([recipe]);
    expect(store.byId('a')).toEqual(recipe);
    expect(store.byId('missing')).toBeUndefined();
  });

  it('remembers recipes for lookup without listing them as generated', () => {
    const store = TestBed.inject(RecipeStore);
    store.remember([makeRecipe('b')]);

    expect(store.byId('b')).toBeTruthy();
    expect(store.generated()).toEqual([]);
  });

  it('toggles liked state and persists it to localStorage', () => {
    const store = TestBed.inject(RecipeStore);
    expect(store.isLiked('a')).toBe(false);

    store.setLiked('a', true);
    expect(store.isLiked('a')).toBe(true);
    expect(JSON.parse(localStorage.getItem('cac_liked_recipes')!)).toContain('a');

    store.setLiked('a', false);
    expect(store.isLiked('a')).toBe(false);
    expect(JSON.parse(localStorage.getItem('cac_liked_recipes')!)).not.toContain('a');
  });

  it('loads previously liked ids from localStorage on init', () => {
    localStorage.setItem('cac_liked_recipes', JSON.stringify(['x']));
    const store = TestBed.inject(RecipeStore);

    expect(store.isLiked('x')).toBe(true);
  });
});
