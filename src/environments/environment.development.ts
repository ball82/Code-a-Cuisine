/**
 * Entwicklungs-Konfiguration. Enthält NUR öffentliche Werte und wird committed.
 * Geheimnisse (z.B. Gemini-API-Key) liegen ausschliesslich in n8n.
 */
export const environment = {
  production: false,
  /** n8n-Webhook für die Rezeptgenerierung. */
  recipeWebhookUrl: 'https://ball82.app.n8n.cloud/webhook/generate-recipe',
  /** n8n-Webhook fürs Liken eines Rezepts. */
  likeWebhookUrl: '',
  /** Öffentliche Firebase-Config (zum direkten Lesen der recipes-Collection). */
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
};
