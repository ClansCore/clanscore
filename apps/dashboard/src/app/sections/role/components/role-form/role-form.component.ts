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
import { Role } from '../../../../core/models/domain/role.model';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogActions,
    MatDialogContent
  ],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss'
})
export class RoleFormComponent {
  readonly dialogRef = inject(MatDialogRef<RoleFormComponent>);
  readonly data = inject<{role: Role, title: string, confirmationText: string}>(MAT_DIALOG_DATA);
  roleForm;
    
  constructor(private fb: FormBuilder) {
    this.roleForm = this.fb.nonNullable.group({
      id: [''],
      name: ['', [Validators.required]],
      discordPosition: [0, [Validators.required]]
    });

    if(!this.data.role.id) return;

    this.roleForm.patchValue({
      id: this.data.role.id,
      name: this.data.role.name,
      discordPosition: this.data.role.discordPosition,
    })
  }

  onSubmit(){
    const formValue = this.roleForm.getRawValue();
    const updateRole : Role = {
      id: formValue.id,
      name: formValue.name,
      discordPosition: formValue.discordPosition
    }
    this.dialogRef.close(updateRole);
  }

  onCancel(){
    this.dialogRef.close(false);
  }

      
}
