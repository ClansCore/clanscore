import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { UserActions, UserSelectors } from '../../../user/store';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../../core/models/domain/user.model';
import { PasswordFormComponent } from '../../components/password-form/password-form.component';
import { AdminUserTableComponent } from '../../components/admin-user-table/admin-user-table.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Actions, ofType } from '@ngrx/effects';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserFormComponent } from '../../../user/components/user-form/user-form.component';
import { ConfirmationDialogComponent } from '../../../../core/dialogs/confirmation-dialog/confirmation-dialog.component';
import { RoleActions } from '../../../role/store';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, AdminUserTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss']
})
export class AdminPageComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private actions$ = inject(Actions);
  private subscriptions = new Subscription();

  users = this.store.selectSignal(UserSelectors.selectUsers);
  loading = this.store.selectSignal(UserSelectors.selectUserLoading);
  private currentUser: User | null = null;

  ngOnInit() {
    this.store.dispatch(UserActions.getAllUsers());
    this.store.dispatch(RoleActions.getRoles());

    // Listen for password set success
    const successSub = this.actions$.pipe(
      ofType(UserActions.setUserPasswordSuccess)
    ).subscribe(({ userId, message }) => {
      const user = this.users().find(u => u.id === userId);
      if (user) {
        this.snackBar.open(
          `Passwort für ${user.firstName} ${user.lastName} wurde erfolgreich gesetzt.`,
          'Schliessen',
          { duration: 3000 }
        );
      }
    });
    this.subscriptions.add(successSub);

    // Listen for password set failure
    const failureSub = this.actions$.pipe(
      ofType(UserActions.setUserPasswordFailure)
    ).subscribe(({ error }) => {
      const userName = this.currentUser 
        ? `${this.currentUser.firstName} ${this.currentUser.lastName}`
        : 'Benutzer';
      this.snackBar.open(
        `Fehler beim Setzen des Passworts für ${userName}: ${error}`,
        'Schliessen',
        { duration: 5000 }
      );
      this.currentUser = null;
    });
    this.subscriptions.add(failureSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  setPassword(user: User) {
    this.currentUser = user;
    const dialogRef = this.dialog.open(PasswordFormComponent, {
      data: {
        user: user,
        title: 'Passwort setzen',
        confirmationText: 'Passwort setzen'
      },
      minWidth: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        this.currentUser = null;
        return;
      }
      
      // result is now an object with password (and optionally currentPassword, but not needed for admin setting password)
      this.store.dispatch(UserActions.setUserPassword({ userId: user.id, password: result.password }));
    });
  }

  addMember() {
    let dialogRef = this.dialog.open(UserFormComponent, { 
      data: {title: "Mitglied Hinzufügen", confirmationText: "Hinzufügen"}, 
      minWidth: '700px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.store.dispatch(UserActions.addUser({user: result}));
    });
  }

  editMember(user: User) {
    let dialogRef = this.dialog.open(UserFormComponent, { 
      data: {user: user, title: 'Mitglied Bearbeiten', confirmationText: "Bearbeiten"}, 
      minWidth: '700px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.store.dispatch(UserActions.updateUser({user: result}));
    });
  }

  deleteMember(user: User) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, { 
      data: `Mitglied ${user.firstName} ${user.lastName} Löschen`
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.store.dispatch(UserActions.deleteUser({user: user}));
    });
  }
}

