import { UserApiModel } from "./user-api.model";

export interface AuthApiModel {
  token: string;
  user: UserApiModel;
}