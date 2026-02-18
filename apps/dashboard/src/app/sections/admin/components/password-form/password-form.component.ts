import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { User } from '../../../../core/models/domain/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogActions, MatDialogContent, MatDialogTitle, CommonModule],
  templateUrl: './password-form.component.html',
  styleUrl: './password-form.component.scss'
})
export class PasswordFormComponent {
  readonly dialogRef = inject(MatDialogRef<PasswordFormComponent>);
  readonly data = inject<{ user?: User; title: string; confirmationText: string }>(MAT_DIALOG_DATA);
  passwordForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // If user is provided, it's admin setting password for another user (no current password needed)
    // If user is not provided, it's user changing own password (current password required)
    if (!this.data.user) {
      // Form with current password for own password change
      this.passwordForm = this.fb.nonNullable.group({
        currentPassword: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      }, { validators: this.passwordMatchValidator.bind(this) });
    } else {
      // Form without current password for admin setting password
      this.passwordForm = this.fb.nonNullable.group({
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      }, { validators: this.passwordMatchValidator.bind(this) });
    }
  }

  passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    if (confirmPassword && confirmPassword.hasError('passwordMismatch') && password && password.value === confirmPassword.value) {
      confirmPassword.setErrors(null);
    }
    return null;
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      const formValue = this.passwordForm.getRawValue() as Record<string, string>;
      // Return object with password and optionally currentPassword
      const result: { password: string; currentPassword?: string } = {
        password: formValue['password']
      };
      if (!this.data.user && formValue['currentPassword']) {
        result.currentPassword = formValue['currentPassword'];
      }
      this.dialogRef.close(result);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}

