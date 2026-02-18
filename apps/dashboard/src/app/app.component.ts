import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Store } from '@ngrx/store';
import { AuthAction, AuthSelectors } from './sections/auth/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PasswordFormComponent } from './sections/admin/components/password-form/password-form.component';
import { UserActions } from './sections/user/store';
import { Actions, ofType } from '@ngrx/effects';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, RouterLink, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ClansCore';

  private store = inject(Store);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private actions$ = inject(Actions);
  private subscriptions = new Subscription();

  loggedIn = this.store.selectSignal(AuthSelectors.selectLoggedIn);
  loggedInUser = this.store.selectSignal(AuthSelectors.selectLoggedInUser);
  authLoading = this.store.selectSignal(AuthSelectors.selectAuthLoading);

  get isAdmin(): boolean {
    return this.loggedInUser()?.roles?.includes('PASSWORD_ADMIN') ?? false;
  }

  constructor() { }
  ngOnInit(): void {
    this.store.dispatch(AuthAction.init());

    // Listen for own password change success
    const ownPasswordSuccessSub = this.actions$.pipe(
      ofType(UserActions.changeOwnPasswordSuccess)
    ).subscribe(() => {
      this.snackBar.open(
        'Ihr Passwort wurde erfolgreich geändert.',
        'Schliessen',
        { duration: 3000 }
      );
    });
    this.subscriptions.add(ownPasswordSuccessSub);

    // Listen for own password change failure
    const ownPasswordFailureSub = this.actions$.pipe(
      ofType(UserActions.changeOwnPasswordFailure)
    ).subscribe(({ error }) => {
      this.snackBar.open(
        `Fehler beim Ändern des Passworts: ${error}`,
        'Schliessen',
        { duration: 5000 }
      );
    });
    this.subscriptions.add(ownPasswordFailureSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  logout(): void {
    this.store.dispatch(AuthAction.logout());
  }

  changePassword(): void {
    const user = this.loggedInUser();
    if (!user) return;

    const dialogRef = this.dialog.open(PasswordFormComponent, {
      data: {
        title: 'Passwort ändern',
        confirmationText: 'Passwort ändern'
      },
      minWidth: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      // Use changeOwnPassword action for regular users (uses /me/password endpoint)
      // result is now an object with password and currentPassword
      this.store.dispatch(UserActions.changeOwnPassword({ 
        password: result.password,
        currentPassword: result.currentPassword 
      }));
    });
  }
}
