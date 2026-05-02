import { User } from './user';

export interface Message {
  _id: string;
  text: string;
  viewed: boolean;
  emitter: User | string;
  receiver: User | string;
  createdAt?: string;
  updatedAt?: string;
}
