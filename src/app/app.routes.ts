import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';
import { Ingredients } from './features/ingredients/ingredients';
import { Preferences } from './features/preferences/preferences';
import { RecipeResults } from './features/recipe-results/recipe-results';
import { RecipeDetail } from './features/recipe-detail/recipe-detail';
import { Cookbook } from './features/cookbook/cookbook';
import { CookbookCategory } from './features/cookbook-category/cookbook-category';
import { Imprint } from './features/imprint/imprint';

/**
 * Application route table.
 *
 * - `''` – Landing (hero).
 * - `ingredients` – step 1 of the generator (target of the "Get started" button).
 * - `preferences` – step 2 of the generator (servings, cooks, preferences).
 * - `recipe-results` – the three freshly generated recipes.
 * - `recipe/:id` – recipe detail page; the query param `?from=results|cookbook`
 *   controls the back path.
 * - `cookbook` – public recipe library (accessible without an account).
 * - `cookbook/:cuisine` – category page of a cuisine (e.g. `/cookbook/italian`).
 * - `imprint` – imprint / legal information.
 * - `**` – redirects anything unknown back to the landing page.
 */
export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'ingredients', component: Ingredients },
  { path: 'preferences', component: Preferences },
  { path: 'recipe-results', component: RecipeResults },
  { path: 'recipe/:id', component: RecipeDetail },
  { path: 'cookbook', component: Cookbook },
  { path: 'cookbook/:cuisine', component: CookbookCategory },
  { path: 'imprint', component: Imprint },
  { path: '**', redirectTo: '' }
];
