import { RoleApiModel } from '../api/role-api.model';
import { UserApiModel } from '../api/user-api.model';
import { Role } from '../domain/role.model';
import { User } from '../domain/user.model';

export class RoleMapper {
  static fromApi(api: RoleApiModel): Role {
    return {
      id: api.id,
      name: api.name,
      discordPosition: api.discordPosition,
    };
  }

  static toApi(role: Role): RoleApiModel {
    return {
      id: role.id,
      name: role.name,
      discordPosition: role.discordPosition,
    };
  }
}