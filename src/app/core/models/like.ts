/** Vertrag 3 — Anfrage an den n8n-Webhook `like-recipe` (nur die recipeId). */
export interface LikeRequest {
  recipeId: string;
}

/**
 * Vertrag 3 — Antwort von `like-recipe` (Toggle wie Instagram-Herz).
 * `liked`: Zustand NACH dem Toggle. `newLikeCount`: aktueller Zählerstand.
 */
export interface LikeResponse {
  liked: boolean;
  newLikeCount: number;
}
