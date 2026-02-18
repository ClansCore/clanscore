import { UserApiModel } from '../api/user-api.model';
import { User } from '../domain/user.model';

export class UserMapper {
  static fromApi(api: UserApiModel): User {
    return {
      id: api.id,
      firstName: api.firstName,
      lastName: api.lastName,
      nickname: api.nickname,
      birthdate: new Date(api.birthdate),
      address: api.address,
      phone: api.phone,
      email: api.email,
      score: api.score,
      roles: api.roles
    };
  }

  static toApi(user: User): UserApiModel {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      birthdate: user.birthdate.toISOString(),
      address: user.address,
      phone: user.phone,
      email: user.email,
      score: user.score,
      roles: user.roles
    };
  }
}