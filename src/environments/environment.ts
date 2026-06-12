/**
 * Live-Konfiguration. Enthält NUR öffentliche Werte (Webhook-URLs + Firebase-Config)
 * und wird committed. Geheimnisse (z.B. Gemini-API-Key) liegen ausschliesslich in n8n.
 */
export const environment = {
  production: true,
  /** n8n-Webhook für die Rezeptgenerierung. */
  recipeWebhookUrl: '',
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
