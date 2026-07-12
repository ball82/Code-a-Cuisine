/**
 * Vertrag 3 — Anfrage an den n8n-Webhook `like-recipe`.
 * Der Workflow identifiziert den Nutzer über eine clientseitige `userId`
 * (stabile anonyme ID aus dem localStorage).
 */
export interface LikeRequest {
  recipeId: string;
  userId: string;
}

/**
 * Vertrag 3 — Antwort von `like-recipe` (Toggle wie Instagram-Herz).
 * `liked`: Zustand NACH dem Toggle. `likes`: aktueller Zählerstand.
 */
export interface LikeResponse {
  recipeId?: string;
  liked: boolean;
  likes: number;
}
