import { Injectable, signal } from '@angular/core';

/** Unterstützte Sprachen. */
export type Lang = 'en' | 'de';

/** localStorage-Schlüssel für die gewählte Sprache. */
const STORAGE_KEY = 'cac_lang';

/** Übersetzungstabelle: pro Schlüssel ein Text je Sprache. */
const TRANSLATIONS: Record<string, { en: string; de: string }> = {
  // ---- Navigation / gemeinsame CTAs ----
  'nav.back': { en: 'Back', de: 'Zurück' },
  'nav.cookbook': { en: 'Cookbook', de: 'Kochbuch' },
  'nav.recipes': { en: 'Recipes', de: 'Rezepte' },
  'cta.getStarted': { en: 'Get started', de: 'Loslegen' },
  'cta.generateA': { en: 'Generate a recipe', de: 'Rezept generieren' },
  'cta.generateNew': { en: 'Generate new recipe', de: 'Neues Rezept generieren' },
  'common.cookingTime': { en: 'Cooking time', de: 'Kochzeit' },
  'common.min': { en: 'min', de: 'Min' },

  // ---- Language toggle ----
  'lang.label': { en: 'Language', de: 'Sprache' },

  // ---- Landing ----
  'landing.eyebrow': { en: 'AI-Powered recipe generator', de: 'KI-gestützter Rezeptgenerator' },
  'landing.inspiration': { en: 'Hungry for inspiration?', de: 'Lust auf Inspiration?' },
  'landing.goToCookbook': { en: 'Go to cookbook', de: 'Zum Kochbuch' },

  // ---- Ingredients (Generate recipe) ----
  'ingredients.title': { en: 'Generate recipe', de: 'Rezept generieren' },
  'ingredients.subtitle': {
    en: 'Got random stuff in your kitchen? Pop it in—we’ve got the perfect recipe waiting.',
    de: 'Zufälliges Zeug in der Küche? Rein damit — das perfekte Rezept wartet schon.'
  },
  'ingredients.ingredient': { en: 'Ingredient', de: 'Zutat' },
  'ingredients.servingSize': { en: 'Serving size', de: 'Menge' },
  'ingredients.placeholder': { en: 'e.g. Pasta', de: 'z. B. Pasta' },
  'ingredients.listTitle': { en: 'List of your Ingredients', de: 'Deine Zutatenliste' },
  'ingredients.empty': {
    en: 'No ingredients yet — add your first one on the left.',
    de: 'Noch keine Zutaten — füge links die erste hinzu.'
  },
  'ingredients.next': { en: 'Next step', de: 'Weiter' },
  'ingredients.addAria': { en: 'Add an ingredient', de: 'Zutat hinzufügen' },
  'ingredients.listAria': { en: 'Your ingredients', de: 'Deine Zutaten' },
  'ingredients.amountAria': { en: 'Amount', de: 'Menge' },
  'ingredients.unitAria': { en: 'Unit', de: 'Einheit' },
  'ingredients.addBtn': { en: 'Add ingredient', de: 'Zutat hinzufügen' },
  'ingredients.saveBtn': { en: 'Save changes', de: 'Änderungen speichern' },
  'ingredients.editBtn': { en: 'Edit', de: 'Bearbeiten' },
  'ingredients.deleteBtn': { en: 'Delete', de: 'Löschen' },

  // ---- Units ----
  'unit.gram': { en: 'gram', de: 'Gramm' },
  'unit.ml': { en: 'ml', de: 'ml' },
  'unit.liter': { en: 'liter', de: 'Liter' },
  'unit.piece': { en: 'piece', de: 'Stück' },

  // ---- Preferences ----
  'preferences.title': { en: 'Choose your preferences', de: 'Wähle deine Präferenzen' },
  'preferences.portionsQ': { en: 'How many portions do you need?', de: 'Wie viele Portionen brauchst du?' },
  'preferences.cooksQ': { en: 'How many are cooking?', de: 'Wie viele kochen mit?' },
  'preferences.portion': { en: 'Portion', de: 'Portion' },
  'preferences.portions': { en: 'Portions', de: 'Portionen' },
  'preferences.person': { en: 'Person', de: 'Person' },
  'preferences.people': { en: 'People', de: 'Personen' },
  'preferences.cookingTime': { en: 'Cooking time', de: 'Kochzeit' },
  'preferences.cuisine': { en: 'Cuisine', de: 'Küche' },
  'preferences.diet': { en: 'Diet preferences', de: 'Ernährung' },
  'preferences.morePortions': { en: 'More portions', de: 'Mehr Portionen' },
  'preferences.fewerPortions': { en: 'Fewer portions', de: 'Weniger Portionen' },
  'preferences.moreCooks': { en: 'More cooks', de: 'Mehr Köche' },
  'preferences.fewerCooks': { en: 'Fewer cooks', de: 'Weniger Köche' },
  'preferences.generating': { en: 'Generating…', de: 'Generiere…' },

  // ---- Time categories ----
  'time.quick': { en: 'Quick', de: 'Schnell' },
  'time.medium': { en: 'Medium', de: 'Mittel' },
  'time.complex': { en: 'Complex', de: 'Aufwändig' },
  'timeHint.quick': { en: 'Up to 20 min', de: 'Bis 20 Min' },
  'timeHint.medium': { en: '20–45 min', de: '20–45 Min' },
  'timeHint.complex': { en: '45+ min', de: '45+ Min' },

  // ---- Cuisines ----
  'cuisine.german': { en: 'German', de: 'Deutsch' },
  'cuisine.italian': { en: 'Italian', de: 'Italienisch' },
  'cuisine.japanese': { en: 'Japanese', de: 'Japanisch' },
  'cuisine.indian': { en: 'Indian', de: 'Indisch' },
  'cuisine.gourmet': { en: 'Gourmet', de: 'Gourmet' },
  'cuisine.fusion': { en: 'Fusion', de: 'Fusion' },
  'cuisineFull.german': { en: 'German cuisine', de: 'Deutsche Küche' },
  'cuisineFull.italian': { en: 'Italian cuisine', de: 'Italienische Küche' },
  'cuisineFull.japanese': { en: 'Japanese cuisine', de: 'Japanische Küche' },
  'cuisineFull.indian': { en: 'Indian cuisine', de: 'Indische Küche' },
  'cuisineFull.gourmet': { en: 'Gourmet cuisine', de: 'Gourmet-Küche' },
  'cuisineFull.fusion': { en: 'Fusion cuisine', de: 'Fusion-Küche' },

  // ---- Diets ----
  'diet.vegetarian': { en: 'Vegetarian', de: 'Vegetarisch' },
  'diet.vegan': { en: 'Vegan', de: 'Vegan' },
  'diet.keto': { en: 'Keto', de: 'Keto' },
  'diet.none': { en: 'No preferences', de: 'Keine Vorgabe' },

  // ---- Errors ----
  'error.validation': {
    en: 'Please check your ingredients and preferences and try again.',
    de: 'Bitte prüfe deine Zutaten und Präferenzen und versuche es erneut.'
  },
  'error.quota': {
    en: 'Our daily recipe quota is used up. Please try again tomorrow.',
    de: 'Unser Tageslimit ist erreicht. Bitte versuch es morgen wieder.'
  },
  'error.generic': {
    en: 'Something went wrong while generating your recipes. Please try again.',
    de: 'Beim Generieren ist etwas schiefgelaufen. Bitte versuch es erneut.'
  },

  // ---- Loader ----
  'loader.generating': { en: 'Generating your recipes', de: 'Deine Rezepte werden generiert' },

  // ---- Error dialog ----
  'dialog.heading': { en: 'Ups! Not quite enough…', de: 'Ups! Nicht ganz genug…' },
  'dialog.message': {
    en: 'Your ingredients (or the amounts) are not enough for the recipes you asked for. Add a bit more and try again.',
    de: 'Deine Zutaten (oder die Mengen) reichen nicht für die gewünschten Rezepte. Füge etwas hinzu und versuch es erneut.'
  },
  'dialog.action': { en: 'Go back to ingredients', de: 'Zurück zu den Zutaten' },

  // ---- Recipe card ----
  'card.recipe': { en: 'Recipe', de: 'Rezept' },
  'card.view': { en: 'View', de: 'Ansehen' },

  // ---- Results ----
  'results.title': { en: 'Generated recipes', de: 'Generierte Rezepte' },
  'results.subtitle': {
    en: 'Here are three recipes tailored to your ingredients and preferences. Pick one and start cooking!',
    de: 'Hier sind drei Rezepte, passend zu deinen Zutaten und Präferenzen. Wähl eins und leg los!'
  },

  // ---- Recipe detail ----
  'detail.cookingPerson': { en: 'Cooking person', de: 'Wer kocht' },
  'detail.chef': { en: 'Chef', de: 'Koch' },
  'detail.nutrition': { en: 'Nutritional information', de: 'Nährwerte' },
  'detail.portion': { en: 'portion', de: 'Portion' },
  'detail.portions': { en: 'portions', de: 'Portionen' },
  'nutrition.energy': { en: 'kcal energy', de: 'kcal Energie' },
  'nutrition.protein': { en: 'protein', de: 'Protein' },
  'nutrition.fat': { en: 'fat', de: 'Fett' },
  'nutrition.carbs': { en: 'carbs', de: 'Kohlenhydrate' },
  'detail.ingredients': { en: 'Ingredients', de: 'Zutaten' },
  'detail.yourIngredients': { en: 'Your ingredients', de: 'Deine Zutaten' },
  'detail.extraIngredients': { en: 'Extra ingredients', de: 'Zusätzliche Zutaten' },
  'detail.directions': { en: 'Directions', de: 'Zubereitung' },
  'detail.giveHeart': { en: 'Give it a heart', de: 'Gib ein Herz' },

  // ---- Cookbook ----
  'cookbook.title': { en: 'Cookbook', de: 'Kochbuch' },
  'cookbook.lead': {
    en: 'From quick bites to gourmet delights, explore them all in our ultimate cookbook and get inspired for your next culinary adventure.',
    de: 'Von schnellen Snacks bis zu Gourmet-Genüssen — entdecke alles in unserem Kochbuch und lass dich für dein nächstes kulinarisches Abenteuer inspirieren.'
  },
  'cookbook.mostLiked': { en: 'Most liked recipes', de: 'Beliebteste Rezepte' },
  'cookbook.empty': {
    en: 'No recipes yet — be the first to generate one!',
    de: 'Noch keine Rezepte — generiere das erste!'
  },
  'cookbook.categoriesAria': { en: 'Cuisine categories', de: 'Küchen-Kategorien' },
  'cookbook.imprint': { en: 'Imprint', de: 'Impressum' },

  // ---- Cookbook category ----
  'category.empty': {
    en: 'No recipes in this category yet. Generate one to get started!',
    de: 'Noch keine Rezepte in dieser Kategorie. Generiere eins, um loszulegen!'
  },
  'category.prevPage': { en: 'Previous page', de: 'Vorherige Seite' },
  'category.nextPage': { en: 'Next page', de: 'Nächste Seite' },
  'category.pagination': { en: 'Pagination', de: 'Seitennavigation' },

  // ---- Imprint ----
  'imprint.title': { en: 'Imprint', de: 'Impressum' },
  'imprint.about': {
    en: 'An AI-powered recipe generator that turns your leftover ingredients into three tailored recipes — built to help reduce food waste.',
    de: 'Ein KI-gestützter Rezeptgenerator, der aus deinen Resten drei passende Rezepte macht — für weniger Lebensmittelverschwendung.'
  },
  'imprint.contactTitle': { en: 'Contact', de: 'Kontakt' },
  'imprint.responsible': { en: 'Responsible for content', de: 'Verantwortlich für den Inhalt' },
  'imprint.email': { en: 'Email', de: 'E-Mail' },
  'imprint.address': { en: 'Address', de: 'Adresse' },
  'imprint.disclaimerTitle': { en: 'Disclaimer', de: 'Haftungsausschluss' },
  'imprint.disclaimer': {
    en: 'Recipes are generated automatically and provided without warranty. Always check ingredients for allergens and food safety before cooking.',
    de: 'Rezepte werden automatisch erzeugt und ohne Gewähr bereitgestellt. Prüfe Zutaten vor dem Kochen stets auf Allergene und Lebensmittelsicherheit.'
  }
};

/**
 * Laufzeit-Sprachumschaltung (EN/DE) ohne Reload. Komponenten lesen Texte über
 * `t(key)`; da `t` das `lang`-Signal liest, aktualisieren sich alle Bindings
 * automatisch beim Umschalten. Die Wahl wird im localStorage gemerkt.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  /** Aktuell aktive Sprache. */
  readonly lang = signal<Lang>(this.load());

  constructor() {
    this.apply(this.lang());
  }

  /** Setzt die Sprache, merkt sie und aktualisiert das <html lang>-Attribut. */
  setLang(lang: Lang): void {
    this.lang.set(lang);
    this.apply(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* localStorage nicht verfügbar – Wahl gilt nur für die Sitzung. */
    }
  }

  /** Übersetzt einen Schlüssel in die aktive Sprache (Fallback: der Schlüssel selbst). */
  t(key: string): string {
    return TRANSLATIONS[key]?.[this.lang()] ?? key;
  }

  private apply(lang: Lang): void {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }

  private load(): Lang {
    if (typeof localStorage === 'undefined') return 'en';
    return localStorage.getItem(STORAGE_KEY) === 'de' ? 'de' : 'en';
  }
}
