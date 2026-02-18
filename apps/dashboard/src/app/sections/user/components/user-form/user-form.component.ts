import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { User } from '../../../../core/models/domain/user.model';
import { Store } from '@ngrx/store';
import { RoleSelectors } from '../../../role/store';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogActions,
    MatDialogContent,
    MatSelectModule
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent {
  private store = inject(Store);
  readonly dialogRef = inject(MatDialogRef<UserFormComponent>);
  readonly data = inject<{user: User, title: string, confirmationText: string}>(MAT_DIALOG_DATA);
  roles = this.store.selectSignal(RoleSelectors.selectRoles);
  address = "";
  zip = "";
  city = "";
  userForm;
    
  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.nonNullable.group({
      id: [''],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      nickname: ['', [Validators.required]],
      birthdate: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      email: ['', [Validators.required]],
      roles: this.fb.control<string[]>([]),
    });
    if(!this.data?.user) return;


    if(this.data.user.address) this.splitAddress(this.data.user.address);

    this.userForm.patchValue({
      id: this.data.user.id,
      firstName: this.data.user.firstName,
      lastName: this.data.user.lastName,
      nickname: this.data.user.nickname,
      birthdate: this.data.user.birthdate.toISOString(),
      email: this.data.user.email,
      city: this.city,
      zip: this.zip,
      address: this.address,
      roles: this.data.user.roles
    });
  }

  private splitAddress(fullAddress: string){
    const parts = fullAddress.split(',');

    if (parts.length === 2) {
      this.address = parts[0].trim();
      const zipCityPart = parts[1].trim(); 
      const [first, ...rest] = zipCityPart.split(' ');
      this.zip = first;
      this.city = rest.join(' ');
    } else {
      this.address = fullAddress.trim();
    }

  }

  onSubmit(){
    const formValue = this.userForm.getRawValue();
    const updateUser : Partial<User> = {
      id: formValue.id,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      nickname: formValue.nickname,
      birthdate: new Date(formValue.birthdate),
      email: formValue.email,
      address: formValue.address + ", " + formValue.zip + " " + formValue.city,
      phone: "",
      roles: formValue.roles ?? []
    }
    this.dialogRef.close(updateUser);
  }

  onCancel(){
    this.dialogRef.close(false);
  }

      
}
