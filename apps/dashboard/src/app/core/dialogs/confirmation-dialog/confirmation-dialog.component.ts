import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { UserFormComponent } from '../../../sections/user/components/user-form/user-form.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [MatDialogActions,
      MatDialogContent, MatButtonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserFormComponent>);
  readonly data = inject<string>(MAT_DIALOG_DATA);

  onSubmit(){
    this.dialogRef.close(true);
  }

  onCancel(){
    this.dialogRef.close(false);
  }
}
