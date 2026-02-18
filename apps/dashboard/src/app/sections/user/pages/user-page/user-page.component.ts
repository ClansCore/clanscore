import { Component, inject, OnInit } from '@angular/core';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { UserActions, UserSelectors } from '../../store';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { User } from '../../../../core/models/domain/user.model';
import { ConfirmationDialogComponent } from '../../../../core/dialogs/confirmation-dialog/confirmation-dialog.component';
import { RoleActions } from '../../../role/store';


@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [UserTableComponent, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.scss']
})
export class UserPageComponent implements OnInit {
  private store = inject(Store);
  readonly dialog = inject(MatDialog);

  users = this.store.selectSignal(UserSelectors.selectUsers);
  loading = this.store.selectSignal(UserSelectors.selectUserLoading);

  ngOnInit() {
    this.store.dispatch(UserActions.getAllUsers());
    this.store.dispatch(RoleActions.getRoles());
  }

  addMember(){
    let dialogRef = this.dialog.open(UserFormComponent, { data: {title: "Mitglied Hinzufügen", confirmationText: "Hinzufügen"}, minWidth: '700px'});
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.store.dispatch(UserActions.addUser({user: result}));
    });
  }

  editMember(user: User){
    let dialogRef = this.dialog.open(UserFormComponent, { data: {user: user, title: 'Mitglied Bearbeiten', confirmationText: "Bearbeiten"}, minWidth: '700px'});
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.store.dispatch(UserActions.updateUser({user: result}));
    });
  }

  deleteMember(user: User){
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: `Mitglied ${user.firstName} ${user.lastName} Löschen`});
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.store.dispatch(UserActions.deleteUser({user: user}));
    });
    
  }
}

