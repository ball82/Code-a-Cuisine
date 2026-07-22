import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

/**
 * Anwendungsweite Angular-Provider.
 *
 * `provideHttpClient()` stellt den `HttpClient` bereit – genutzt für die lokale
 * Autocomplete-Liste (`assets/data/ingredients.json`) und die n8n-Webhooks.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient()
  ]
};
