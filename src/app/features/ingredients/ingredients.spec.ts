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

  function flushIngredients(): void {
    httpMock.expectOne('assets/data/ingredients.json').flush(['Pasta', 'Pastrami']);
  }

  it('should create', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushIngredients();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('adds an ingredient to the list', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('Pasta');
    cmp.amount.set(100);
    cmp.addOrUpdate();

    expect(cmp.items()).toEqual([{ name: 'Pasta', amount: 100, unit: 'gram' }]);
    // Formular wird nach dem Hinzufügen zurückgesetzt
    expect(cmp.name()).toBe('');
  });

  it('does not add when name is empty', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('   ');
    cmp.addOrUpdate();

    expect(cmp.items().length).toBe(0);
  });

  it('suggests matches by prefix', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('Pas');
    expect(cmp.suggestions()).toEqual(['Pasta', 'Pastrami']);
  });
});
