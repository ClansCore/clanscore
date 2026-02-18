import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "../../../environments/environment";
import { UserApiModel } from "../models/api/user-api.model";
import { User } from "../models/domain/user.model";
import { UserMapper } from "../models/mapper/user.mapper";
import { RoleApiModel } from "../models/api/role-api.model";
import { RoleMapper } from "../models/mapper/role.mapper";
import { Role } from "../models/domain/role.model";

@Injectable({ providedIn: 'root' })
export class RoleApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/roles`;

  getAllRoles(): Observable<Role[]> {
    return this.http.get<RoleApiModel[]>(this.baseUrl).pipe(
      map(roles => roles.map(RoleMapper.fromApi))
    );
  }

  addRole(role: Role): Observable<Role> {
    return this.http.post<RoleApiModel>(this.baseUrl, {role}).pipe(
      map(role => RoleMapper.fromApi(role))
    );
  }

  updateRole(updateRole: Role): Observable<Role> {
    const role = RoleMapper.toApi(updateRole);
    return this.http.patch<RoleApiModel>(`${this.baseUrl}/${updateRole.id}`, {role}).pipe(
      map(role => RoleMapper.fromApi(role))
    );
  }

  deleteRole(deleteRole: Role): Observable<Role> {
    const role = RoleMapper.toApi(deleteRole);
    return this.http.delete<RoleApiModel>(`${this.baseUrl}/${role.id}`).pipe(
      map((role) => deleteRole)
    );
  }
}