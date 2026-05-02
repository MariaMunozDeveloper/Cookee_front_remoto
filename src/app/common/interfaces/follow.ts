import { User } from './user';

export interface Follow {
  _id: string;
  user: User | string;
  followed: User | string;
  createdAt?: string;
  updatedAt?: string;
}
