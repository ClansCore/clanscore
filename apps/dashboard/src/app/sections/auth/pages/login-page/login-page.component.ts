import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { AuthAction, AuthSelectors } from '../../store';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ 
  CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private store = inject(Store);
  loginForm;

    constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  loading = this.store.selectSignal(AuthSelectors.selectAuthLoading);
  error = this.store.selectSignal(AuthSelectors.selectAuthError);
  
  


  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.store.dispatch(AuthAction.login(this.loginForm.getRawValue()))
  }

}
