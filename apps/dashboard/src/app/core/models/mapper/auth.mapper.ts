import { AuthApiModel } from '../api/auth-api.model';
import { TaskApiModel } from '../api/task-api.model';
import { UserApiModel } from '../api/user-api.model';
import { Auth } from '../domain/auth.model';
import { Task } from '../domain/task.model';
import { User } from '../domain/user.model';
import { UserMapper } from './user.mapper';

export class AuthMapper {
  static fromApi(api: AuthApiModel): Auth {
    return {
      token: api.token,
      user: UserMapper.fromApi(api.user)
    };
  }

  static toApi(auth: Auth): AuthApiModel {
    return {
      token: auth.token,
      user: UserMapper.toApi(auth.user) 
    };
  }
}