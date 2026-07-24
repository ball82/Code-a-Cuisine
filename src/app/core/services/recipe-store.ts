import { Injectable, signal } from '@angular/core';

import { Recipe } from '../models/recipe';

/** localStorage key for the recipe IDs liked by this browser. */
const LIKED_KEY = 'cac_liked_recipes';

/**
 * Holds the most recently generated recipes for the results and detail pages
 * and remembers which recipes this browser has liked.
 *
 * Why the like state lives here (and in localStorage): the like marker is
 * stored server-side in the locked `recipeLikes` collection and is keyed by
 * server IP – the frontend can NOT read it from Firestore (see
 * PROJEKT-KONTEXT.md §6). We therefore remember the state locally as soon as
 * the user clicks or learns it from the like response.
 */
@Injectable({ providedIn: 'root' })
export class RecipeStore {
  /** The most recently generated recipes (order = display on the results page). */
  readonly generated = signal<Recipe[]>([]);

  /** All recipes ever seen (generated OR from the cookbook) for the detail lookup. */
  private readonly cache = new Map<string, Recipe>();

  /** IDs that this browser has liked. */
  readonly liked = signal<Set<string>>(this.loadLiked());

  /** Adopts freshly generated recipes as the current results list. */
  setGenerated(recipes: Recipe[]): void {
    this.remember(recipes);
    this.generated.set(recipes);
  }

  /** Puts recipes into the lookup cache (e.g. when loading the cookbook). */
  remember(recipes: Recipe[]): void {
    for (const recipe of recipes) this.cache.set(recipe.id, recipe);
  }

  /** Finds a recipe by ID (from generated or cached cookbook data). */
  byId(id: string): Recipe | undefined {
    return this.cache.get(id);
  }

  /**
   * Applies the new like counter (from the like response) to the lookup cache
   * and the results list so detail and results cards show the value without a
   * reload. The affected recipes are replaced by new objects so the signals
   * update reactively.
   */
  updateLikeCount(id: string, likes: number): void {
    const cached = this.cache.get(id);
    if (cached) this.cache.set(id, { ...cached, likes });
    this.generated.update((list) =>
      list.some((r) => r.id === id) ? list.map((r) => (r.id === id ? { ...r, likes } : r)) : list
    );
  }

  /** Has this browser liked the recipe? */
  isLiked(id: string): boolean {
    return this.liked().has(id);
  }

  /** Sets the local like state and mirrors it into localStorage. */
  setLiked(id: string, liked: boolean): void {
    this.liked.update((current) => {
      const next = new Set(current);
      if (liked) next.add(id);
      else next.delete(id);
      this.persist(next);
      return next;
    });
  }

  /**
   * Loads the liked recipe IDs from localStorage.
   * @returns Set of IDs; empty if nothing is stored or it is not readable.
   */
  private loadLiked(): Set<string> {
    if (typeof localStorage === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(LIKED_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  }

  /**
   * Writes the liked recipe IDs into localStorage. If it is unavailable
   * (private mode), the like is kept for the session only.
   * @param ids Current set of liked recipe IDs.
   */
  private persist(ids: Set<string>): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
    } catch {
      return;
    }
  }
}
