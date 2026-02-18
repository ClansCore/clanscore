export interface User {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  birthdate: Date;
  address: string;
  email: string;
  phone: string;
  score: number;
  roles: string[];
}