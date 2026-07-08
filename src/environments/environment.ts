/**
 * Live-Konfiguration. Enthält NUR öffentliche Werte (Webhook-URLs + Firebase-Config)
 * und wird committed. Geheimnisse (z.B. Gemini-API-Key) liegen ausschliesslich in n8n.
 */
export const environment = {
  production: true,
  /** n8n-Webhook für die Rezeptgenerierung. */
  recipeWebhookUrl: 'https://n8n.bajo-n8n.uk/webhook/generate-recipe',
  /** n8n-Webhook fürs Liken eines Rezepts. */
  likeWebhookUrl: 'https://n8n.bajo-n8n.uk/webhook/like-recipe',
  /** Öffentliche Firebase-Config (zum direkten Lesen der recipes-Collection). */
  firebase: {
    apiKey: 'AIzaSyDI_cPDUutbzh81qukv4HtlLOcKIuXOeyc',
    authDomain: 'code-a-cuisine-9c87f.firebaseapp.com',
    projectId: 'code-a-cuisine-9c87f',
    storageBucket: 'code-a-cuisine-9c87f.firebasestorage.app',
    messagingSenderId: '841286212535',
    appId: '1:841286212535:web:58e228d29679fef682e632',
    measurementId: 'G-D0BG0DQ00Q',
  },
};
