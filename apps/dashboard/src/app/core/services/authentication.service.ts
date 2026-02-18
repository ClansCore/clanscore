import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, map, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthApiModel } from "../models/api/auth-api.model";
import { Auth } from "../models/domain/auth.model";
import { AuthMapper } from "../models/mapper/auth.mapper";
import { User } from "../models/domain/user.model";
import { Registration } from "../models/domain/registration.model";

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/auth`;

  login(email: string, password: string): Observable<Auth> {
    return this.http.post<AuthApiModel>(`${this.baseUrl}/login`, { email, password }).pipe(
        tap(auth => {
          localStorage.setItem('user', JSON.stringify(auth.user));
          localStorage.setItem('token', auth.token);
        }),
        map(auth => AuthMapper.fromApi(auth))
    );
  }

  register(user: Registration): Observable<string>{
    return this.http.post<string>(`${this.baseUrl}/register`, { user });
  }

  logout(): void{
     this.http.get(`${this.baseUrl}/logout`);
  }
}