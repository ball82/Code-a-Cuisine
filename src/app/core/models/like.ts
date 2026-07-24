/**
 * Contract 3 — request to the n8n webhook `like-recipe`.
 * The workflow identifies the user via a client-side `userId`
 * (stable anonymous ID from localStorage).
 */
export interface LikeRequest {
  recipeId: string;
  userId: string;
}

/**
 * Contract 3 — response from `like-recipe` (toggle like an Instagram heart).
 * `liked`: state AFTER the toggle. `likes`: current counter value.
 */
export interface LikeResponse {
  recipeId?: string;
  liked: boolean;
  likes: number;
}
