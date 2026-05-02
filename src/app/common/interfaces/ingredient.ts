export interface Ingredient {
  name: string;
  quantity: number | null;
  unit:
    | 'g'
    | 'kg'
    | 'ml'
    | 'l'
    | 'cucharadita'
    | 'cucharada'
    | 'taza'
    | 'unidad'
    | 'pizca'
    | 'tbsp'
    | 'cup'
    | 'tsp'
    | 'oz';
}
