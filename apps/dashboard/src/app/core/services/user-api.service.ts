import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, map, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { UserApiModel } from "../models/api/user-api.model";
import { User } from "../models/domain/user.model";
import { UserMapper } from "../models/mapper/user.mapper";

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/user`;

  getAll(): Observable<User[]> {
    return this.http.get<UserApiModel[]>(this.baseUrl).pipe(
      map(users => users.map(UserMapper.fromApi))
    );
  }

  addMember(user: User): Observable<User> {
    return this.http.patch<UserApiModel>(this.baseUrl, {person: user}).pipe(
      map(user => UserMapper.fromApi(user))
    );
  }

  updateMember(updateUser: User): Observable<User> {
    const user = UserMapper.toApi(updateUser);
    return this.http.patch<UserApiModel>(`${this.baseUrl}/${updateUser.id}`, {person: user}).pipe(
      map(user => updateUser)
    );
  }

  deleteMember(deleteUser: User): Observable<User> {
    const user = UserMapper.toApi(deleteUser);
    return this.http.delete<UserApiModel>(`${this.baseUrl}/${user.id}`).pipe(
      map((user) => deleteUser)
    );
  }

  setUserPassword(userId: string, password: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.baseUrl}/${userId}/password`, { password });
  }

  changeOwnPassword(password: string, currentPassword: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.baseUrl}/me/password`, { password, currentPassword });
  }
}