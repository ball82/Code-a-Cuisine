import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';
import { Ingredients } from './features/ingredients/ingredients';
import { Preferences } from './features/preferences/preferences';
import { RecipeResults } from './features/recipe-results/recipe-results';
import { RecipeDetail } from './features/recipe-detail/recipe-detail';
import { Cookbook } from './features/cookbook/cookbook';
import { CookbookCategory } from './features/cookbook-category/cookbook-category';
import { Imprint } from './features/imprint/imprint';

export const routes: Routes = [
  { path: '', component: Landing },
  // Schritt 1 des Generators (Ziel des "Get started"-Buttons auf der Landing-Seite).
  { path: 'ingredients', component: Ingredients },
  // Schritt 2 des Generators (Präferenzen).
  { path: 'preferences', component: Preferences },
  // Ergebnisseite: die drei frisch generierten Rezepte.
  { path: 'recipe-results', component: RecipeResults },
  // Rezept-Detailseite (Query-Param ?from=results|cookbook steuert den Zurück-Weg).
  { path: 'recipe/:id', component: RecipeDetail },
  // Öffentliche Rezept-Bibliothek (ohne Account erreichbar).
  { path: 'cookbook', component: Cookbook },
  // Kategorieseite einer Küche (z.B. /cookbook/italian).
  { path: 'cookbook/:cuisine', component: CookbookCategory },
  // Impressum / rechtliche Angaben.
  { path: 'imprint', component: Imprint },
  // Alles Unbekannte zurück zur Landing-Seite.
  { path: '**', redirectTo: '' }
];
