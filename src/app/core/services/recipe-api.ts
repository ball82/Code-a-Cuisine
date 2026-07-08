import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RecipeRequest } from '../models/recipe-request';
import { RecipeResponse } from '../models/recipe';
import { LikeResponse } from '../models/like';

/**
 * Spricht mit den n8n-Webhooks. Schreiben (Rezepte generieren, liken) läuft
 * ausschliesslich über n8n; das Lesen des Cookbooks erfolgt separat direkt via
 * Firebase SDK.
 */
@Injectable({ providedIn: 'root' })
export class RecipeApi {
  private readonly http = inject(HttpClient);

  /**
   * Schickt die Zutaten + Präferenzen an n8n und erhält 3 fertige, bereits in
   * Firestore gespeicherte Rezepte zurück.
   * @param request Validierte Anfrage nach Vertrag 1.
   * @returns Antwort nach Vertrag 2 (3 Rezepte mit IDs).
   */
  generateRecipes(request: RecipeRequest): Observable<RecipeResponse> {
    return this.http.post<RecipeResponse>(environment.recipeWebhookUrl, request);
  }

  /**
   * Liked/entliked ein Rezept (Toggle). Sendet NUR die recipeId – die IP wird
   * serverseitig aus dem Header ermittelt, niemals vom Client gemeldet.
   * @param recipeId Firestore-ID des zu likenden Rezepts.
   * @returns Vertrag 3: Zustand nach dem Toggle + aktueller Zählerstand.
   */
  likeRecipe(recipeId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(environment.likeWebhookUrl, { recipeId });
  }
}
