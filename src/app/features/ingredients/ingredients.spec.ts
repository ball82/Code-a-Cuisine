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

  /** Answers the component's autocomplete request with two test ingredients. */
  function flushIngredients(): void {
    httpMock.expectOne('data/ingredients.json').flush(['Pasta', 'Pastrami']);
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

  it('does not add a name that is not in the list', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('jidhfoadghvod');
    cmp.addOrUpdate();

    expect(cmp.canAdd()).toBe(false);
    expect(cmp.showUnknownHint()).toBe(true);
    expect(cmp.items().length).toBe(0);
  });

  it('stores the canonical spelling from the list', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('  pAsTa ');
    cmp.addOrUpdate();

    expect(cmp.items()).toEqual([{ name: 'Pasta', amount: 100, unit: 'gram' }]);
  });

  it('adopts the first suggestion on enter', () => {
    const fixture = TestBed.createComponent(Ingredients);
    flushIngredients();
    const cmp = fixture.componentInstance;

    cmp.name.set('Pas');
    cmp.onEnter();

    expect(cmp.name()).toBe('Pasta');
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
