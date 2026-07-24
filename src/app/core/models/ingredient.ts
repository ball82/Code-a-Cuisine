/** Allowed units of measure (technical lowercase values, not the display labels). */
export type Unit = 'gram' | 'ml' | 'liter' | 'piece';

/** A single ingredient with amount and unit (part of Contract 1 and Contract 2). */
export interface Ingredient {
  name: string;
  amount: number;
  unit: Unit;
}
