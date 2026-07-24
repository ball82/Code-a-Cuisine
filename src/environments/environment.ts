/**
 * Live configuration. Contains ONLY public values (webhook URLs + Firebase config)
 * and is committed. Secrets (e.g. the Gemini API key) live exclusively in n8n.
 */
export const environment = {
  production: true,
  /** n8n webhook for recipe generation. */
  recipeWebhookUrl: 'https://n8n.bajo-n8n.uk/webhook/generate-recipe',
  /** n8n webhook for liking a recipe. */
  likeWebhookUrl: 'https://n8n.bajo-n8n.uk/webhook/like-recipe',
  /** Public Firebase config (for directly reading the recipes collection). */
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
