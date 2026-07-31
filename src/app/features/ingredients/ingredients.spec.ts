import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { Ingredients } from './ingredients';

describe('Ingredients', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Ingredients],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  /** Answers the component's local autocomplete request with two test ingredients. */
  function flushLocalIngredients(): void {
    httpMock.expectOne('/data/ingredients.json').flush(['Pasta', 'Pastrami']);
  }

  /** Mock successful API response from Open Food Facts. */
  function flushApiSuccess(productName: string): void {
    const req = httpMock.match((request) => 
      request.url.includes('openfoodfacts.org')
    );
    req.forEach((r) => r.flush({
      count: 1,
      products: [{ product_name: productName }]
    }));
  }

  it('should create', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushLocalIngredients();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('adds an ingredient to the list when validated by API', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushLocalIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('Tomato');
    cmp.amount.set(100);
    
    // Simulate API validation
    flushApiSuccess('Tomato');
    
    cmp.addOrUpdate();

    expect(cmp.items().length).toBe(1);
    expect(cmp.items()[0].name).toBe('Tomato');
  });

  it('does not add when name is empty', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushLocalIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('   ');
    cmp.addOrUpdate();

    expect(cmp.items().length).toBe(0);
  });

  it('suggests matches from API', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushLocalIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('Tom');
    
    // Wait for debounce and flush API response
    setTimeout(() => {
      flushApiSuccess('Tomato');
      expect(cmp.apiSuggestions().length).toBeGreaterThan(0);
    }, 400);
  });
});
