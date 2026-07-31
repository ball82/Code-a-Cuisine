import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

/**
 * Open Food Facts API integration for ingredient validation.
 * Searches the global food database to verify ingredient names.
 */
@Injectable({ providedIn: 'root' })
export class OpenFoodFactsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://world.openfoodfacts.org/cgi/search.pl';

  /**
   * Search for ingredients by name in the Open Food Facts database.
   * Returns an array of matching ingredient names.
   */
  searchIngredients(query: string): Observable<string[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    const params = {
      search_terms: query.trim(),
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      fields: 'product_name,ingredients_text'
    };

    return this.http.get<OpenFoodFactsResponse>(this.apiUrl, { params }).pipe(
      map((response) => this.extractIngredientNames(response, query)),
      catchError(() => of([]))
    );
  }

  /**
   * Check if an ingredient exists in the Open Food Facts database.
   */
  validateIngredient(name: string): Observable<boolean> {
    if (!name || name.trim().length < 2) {
      return of(false);
    }

    return this.searchIngredients(name).pipe(
      map((results) => {
        const normalized = this.normalize(name);
        return results.some((result) => this.normalize(result) === normalized);
      })
    );
  }

  /**
   * Extract unique ingredient names from the API response.
   */
  private extractIngredientNames(response: OpenFoodFactsResponse, query: string): string[] {
    if (!response.products || response.products.length === 0) {
      return [];
    }

    const ingredients = new Set<string>();
    const normalizedQuery = this.normalize(query);

    // Add product names that match the query
    response.products.forEach((product) => {
      if (product.product_name) {
        const normalized = this.normalize(product.product_name);
        if (normalized.includes(normalizedQuery) || normalizedQuery.includes(normalized)) {
          ingredients.add(this.capitalize(product.product_name.trim()));
        }
      }

      // Also extract individual ingredients from the ingredients_text
      if (product.ingredients_text) {
        const parts = product.ingredients_text
          .split(/[,;]/)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);

        parts.forEach((part) => {
          // Remove percentages and other noise
          const cleaned = part.replace(/\d+%?/g, '').replace(/[()]/g, '').trim();
          const normalized = this.normalize(cleaned);
          
          if (cleaned.length >= 2 && (normalized.includes(normalizedQuery) || normalizedQuery.includes(normalized))) {
            ingredients.add(this.capitalize(cleaned));
          }
        });
      }
    });

    return Array.from(ingredients).slice(0, 8);
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private capitalize(value: string): string {
    return value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

interface OpenFoodFactsResponse {
  count: number;
  page: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

interface OpenFoodFactsProduct {
  product_name?: string;
  ingredients_text?: string;
}
