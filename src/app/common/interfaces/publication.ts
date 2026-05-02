import { Ingredient } from './ingredient';
import { Step } from './step';
import { User } from './user';

export interface Publication {
  _id: string;
  user: User | string;
  title: string;
  text: string;
  description: string;
  recommendations: string;
  ingredients: Ingredient[];
  steps: Step[];
  images: string[];
  hashtags: string[];
  likes: string[];
  views: number;
  tiempoHorno: number | null;
  temperaturaHorno: number | null;
  raciones: number | null;
  createdAt?: string;
  updatedAt?: string;
}
