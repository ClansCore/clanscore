import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AnnualPlanApiModel } from '../models/api/annualPlan-api.model';
import { AnnualPlanMapper } from '../models/mapper/annualPlan.mapper';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnnualPlanApiService {
  private readonly base = `${environment.apiUrl}/annualplan`;
  private http = inject(HttpClient);

  getAnnualPlans(): Observable<AnnualPlanApiModel[]> {
    return this.http.get<AnnualPlanApiModel[]>(this.base).pipe(
      map(annualplan => annualplan.map(AnnualPlanMapper.fromApi))
    );
  }

  updateAnnualPlan(id: string, data: Partial<AnnualPlanApiModel>): Observable<AnnualPlanApiModel> {
    return this.http.patch<AnnualPlanApiModel>(`${this.base}/${id}`, { annualPlan: data });
  }
}
