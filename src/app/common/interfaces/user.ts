export interface User {
  _id?: string;
  name: string;
  surname: string;
  nick: string;
  email: string;
  password?: string;
  role?: string;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
