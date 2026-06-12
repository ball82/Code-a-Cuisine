/** Erlaubte Mengeneinheiten (technische Kleinbuchstaben, nicht die Anzeigetexte). */
export type Unit = 'gram' | 'ml' | 'liter' | 'piece';

/** Eine einzelne Zutat mit Menge und Einheit (Teil von Vertrag 1 und Vertrag 2). */
export interface Ingredient {
  name: string;
  amount: number;
  unit: Unit;
}
