import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { AuthAction, AuthSelectors } from '../../store';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { Registration } from '../../../../core/models/domain/registration.model';
import {
  MatSnackBar,
} from '@angular/material/snack-bar';
import moment from 'moment';

@Component({
  selector: 'app-application-form',
  standalone: true,
  providers: [],
  imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
  ],
  templateUrl: './application-form.component.html',
  styleUrl: './application-form.component.scss'
})
export class ApplicationFormComponent {
    private _snackBar = inject(MatSnackBar);
    private store = inject(Store);
    applicationForm;
  
    constructor(private fb: FormBuilder) {
      this.applicationForm = this.fb.nonNullable.group({
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        nickname: ['', [Validators.required]],
        birthdate: ['', [Validators.required]],
        address: ['', [Validators.required]],
        city: ['', [Validators.required]],
        zip: ['', [Validators.required]],
        email: ['', [Validators.required]],
        webPw: ['', [Validators.required]],
      });
    }
  
    loading = this.store.selectSignal(AuthSelectors.selectAuthLoading);
    error = this.store.selectSignal(AuthSelectors.selectAuthError);

    onSubmit(): void {
        if (this.applicationForm.invalid) return;
        const formValue = this.applicationForm.getRawValue();

        const registration: Registration = {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          nickname: formValue.nickname,
          // handle Moment or Date value from datepicker
          birthdate: moment.isMoment(formValue.birthdate)
            ? formValue.birthdate.toDate()
            : new Date(formValue.birthdate),
          address: formValue.address + ", " + formValue.zip + " " + formValue.city,
          email: formValue.email,
          webPw: formValue.webPw,
        };
        this._snackBar.open('Bewerbung wurde abgeschickt', "", {horizontalPosition: 'center', verticalPosition: 'top'});
        this.applicationForm.reset();
        this.store.dispatch(AuthAction.register({registration: registration}))
    }

}
