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
/** localStorage-Schlüssel für die anonyme Nutzer-ID (Like-Identität). */
const USER_ID_KEY = 'cac_user_id';

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
   * Liked/entliked ein Rezept (Toggle). Sendet recipeId + eine stabile anonyme
   * userId (der Workflow identifiziert den Nutzer darüber).
   * @param recipeId Firestore-ID des zu likenden Rezepts.
   * @returns Vertrag 3: Zustand nach dem Toggle + aktueller Zählerstand.
   */
  likeRecipe(recipeId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(environment.likeWebhookUrl, {
      recipeId,
      userId: this.userId()
    });
  }

  /**
   * Stabile anonyme Nutzer-ID aus dem localStorage (einmalig erzeugt).
   * Ersetzt die serverseitige IP-Identität des ursprünglichen Designs.
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
        /* localStorage nicht verfügbar – ID gilt nur für diese Sitzung. */
      }
    }
    return id;
  }
}
