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
 * Routen-Tabelle der Anwendung.
 *
 * - `''` – Landing (Hero).
 * - `ingredients` – Schritt 1 des Generators (Ziel des "Get started"-Buttons).
 * - `preferences` – Schritt 2 des Generators (Portionen, Köche, Präferenzen).
 * - `recipe-results` – die drei frisch generierten Rezepte.
 * - `recipe/:id` – Rezept-Detailseite; der Query-Param `?from=results|cookbook`
 *   steuert den Zurück-Weg.
 * - `cookbook` – öffentliche Rezept-Bibliothek (ohne Account erreichbar).
 * - `cookbook/:cuisine` – Kategorieseite einer Küche (z. B. `/cookbook/italian`).
 * - `imprint` – Impressum / rechtliche Angaben.
 * - `**` – leitet alles Unbekannte zurück zur Landing-Seite.
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
