import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

/**
 * Application-wide Angular providers.
 *
 * `provideHttpClient()` makes the `HttpClient` available – used for the local
 * autocomplete list (`assets/data/ingredients.json`) and the n8n webhooks.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient()
  ]
};
