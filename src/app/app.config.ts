import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Wird für die lokale Autocomplete-Liste (assets/data/ingredients.json) und
    // später für die n8n-Webhooks gebraucht.
    provideHttpClient()
  ]
};
