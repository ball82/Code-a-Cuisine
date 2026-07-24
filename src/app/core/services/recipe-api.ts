import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RecipeRequest } from '../models/recipe-request';
import { RecipeResponse } from '../models/recipe';
import { LikeResponse } from '../models/like';

/**
 * Talks to the n8n webhooks. Writing (generating recipes, liking) goes
 * exclusively through n8n; reading the cookbook happens separately, directly
 * via the Firebase SDK.
 */
/** localStorage key for the anonymous user ID (like identity). */
const USER_ID_KEY = 'cac_user_id';

@Injectable({ providedIn: 'root' })
export class RecipeApi {
  private readonly http = inject(HttpClient);

  /**
   * Sends the ingredients + preferences to n8n and receives back 3 finished
   * recipes that are already stored in Firestore.
   * @param request Validated request per Contract 1.
   * @returns Response per Contract 2 (3 recipes with IDs).
   */
  generateRecipes(request: RecipeRequest): Observable<RecipeResponse> {
    return this.http.post<RecipeResponse>(environment.recipeWebhookUrl, request);
  }

  /**
   * Likes/unlikes a recipe (toggle). Sends recipeId + a stable anonymous
   * userId (the workflow identifies the user by it).
   * @param recipeId Firestore ID of the recipe to like.
   * @returns Contract 3: state after the toggle + current counter value.
   */
  likeRecipe(recipeId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(environment.likeWebhookUrl, {
      recipeId,
      userId: this.userId()
    });
  }

  /**
   * Stable anonymous user ID from localStorage (generated once).
   * Replaces the server-side IP identity of the original design.
   */
  private userId(): string {
    if (typeof localStorage === 'undefined') return 'anonymous';
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      try {
        localStorage.setItem(USER_ID_KEY, id);
      } catch {
        return id;
      }
    }
    return id;
  }
}
