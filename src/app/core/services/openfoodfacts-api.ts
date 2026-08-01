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
   * Returns an array of matching ingredient names (English only).
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
      fields: 'product_name,ingredients_text',
      lc: 'en' // Language code: English only
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
   * Filters out non-Latin/English text and extracts base ingredient names.
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
        const name = product.product_name.trim();
        const normalized = this.normalize(name);
        
        if (this.isLatinText(name) && (normalized.includes(normalizedQuery) || normalizedQuery.includes(normalized))) {
          // Try to extract the base ingredient name if the product name is complex
          const baseIngredient = this.extractBaseIngredient(name, normalizedQuery);
          if (baseIngredient) {
            ingredients.add(this.capitalize(baseIngredient));
          }
          
          // Also add the full product name as an option
          if (ingredients.size < 6) {
            ingredients.add(this.capitalize(name));
          }
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
          
          if (cleaned.length >= 2 && this.isLatinText(cleaned) && (normalized.includes(normalizedQuery) || normalizedQuery.includes(normalized))) {
            const baseIngredient = this.extractBaseIngredient(cleaned, normalizedQuery);
            if (baseIngredient) {
              ingredients.add(this.capitalize(baseIngredient));
            }
          }
        });
      }
    });

    return Array.from(ingredients).slice(0, 8);
  }

  /**
   * Extract the base ingredient from a complex product name.
   * E.g., "Trident Watermelon Flavour" -> "Watermelon"
   */
  private extractBaseIngredient(productName: string, query: string): string | null {
    const words = productName.split(/\s+/);
    
    // Find the word that best matches the query
    for (const word of words) {
      const normalizedWord = this.normalize(word);
      const normalizedQuery = query.toLowerCase();
      
      // Direct match or query is contained in word
      if (normalizedWord === normalizedQuery || normalizedWord.includes(normalizedQuery)) {
        return word;
      }
    }
    
    // If no single word matches perfectly, find words that partially overlap
    for (const word of words) {
      if (word.length >= 3 && this.normalize(word).length >= 3) {
        const normalizedWord = this.normalize(word);
        // Check if there's substantial overlap
        if (query.includes(normalizedWord) || normalizedWord.includes(query.substring(0, Math.min(query.length, 5)))) {
          return word;
        }
      }
    }
    
    return null;
  }

  /**
   * Check if text contains only Latin/English characters (A-Z, a-z, spaces, hyphens).
   * Filters out Chinese, Japanese, Cyrillic, Arabic, etc.
   */
  private isLatinText(text: string): boolean {
    // Allow Latin letters, numbers, spaces, hyphens, apostrophes, and basic punctuation
    return /^[A-Za-z0-9\s\-'\.]+$/.test(text);
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
