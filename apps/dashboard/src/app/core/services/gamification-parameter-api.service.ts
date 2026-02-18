import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GamificationParameterApiModel } from '../models/api/gamificationParameter-api.model';
import { environment } from '../../../environments/environment';

export class GamificationParameterMapper {
  static fromApi(api: GamificationParameterApiModel): GamificationParameterApiModel {
    // Identity function; extend as needed
    return api;
  }
  static toApi(domain: GamificationParameterApiModel): GamificationParameterApiModel {
    return domain;
  }
}

@Injectable({ providedIn: 'root' })
export class GamificationParameterApiService {
  private readonly base = `${environment.apiUrl}/gamificationparameter`;
  private http = inject(HttpClient);

  getGamificationParameter(): Observable<GamificationParameterApiModel> {
    return this.http.get<GamificationParameterApiModel>(this.base).pipe(
      map(GamificationParameterMapper.fromApi)
    );
  }

  updateGamificationParameter(gamificationParameter: Partial<GamificationParameterApiModel>): Observable<GamificationParameterApiModel> {
    return this.http.patch<GamificationParameterApiModel>(this.base, {gamificationParameter}).pipe(
      map(api => GamificationParameterMapper.fromApi(api))
    );
  }
}
