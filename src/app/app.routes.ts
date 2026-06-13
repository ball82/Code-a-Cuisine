import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';
import { Ingredients } from './features/ingredients/ingredients';
import { Cookbook } from './features/cookbook/cookbook';

export const routes: Routes = [
  { path: '', component: Landing },
  // Schritt 1 des Generators (Ziel des "Get started"-Buttons auf der Landing-Seite).
  { path: 'ingredients', component: Ingredients },
  // Öffentliche Rezept-Bibliothek (ohne Account erreichbar).
  { path: 'cookbook', component: Cookbook }
];
