import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../core/dialogs/confirmation-dialog/confirmation-dialog.component';
import { RoleTableComponent } from '../../components/role-table/role-table.component';
import { RoleFormComponent } from '../../components/role-form/role-form.component';
import { RoleActions, RoleSelectors } from '../../store';
import { Role } from '../../../../core/models/domain/role.model';

@Component({
  selector: 'app-role-page',
  standalone: true,
  imports: [RoleTableComponent, RoleFormComponent, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './role-page.component.html',
  styleUrl: './role-page.component.scss'
})
export class RolePageComponent implements OnInit {
  private store = inject(Store);
  readonly dialog = inject(MatDialog);
  roles = this.store.selectSignal(RoleSelectors.selectRoles);
  loading = this.store.selectSignal(RoleSelectors.selectRolesLoading);
  
  ngOnInit() {
      this.store.dispatch(RoleActions.getRoles());
  }

  addRole(){
      let dialogRef = this.dialog.open(RoleFormComponent, { data: {role: {}, title: "Rolle Hinzufügen", confirmationText: "Hinzufügen"}, minWidth: '700px'});
      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
        console.log(result);
        this.store.dispatch(RoleActions.addRole({role: result}));
      });
    }

  editRole(role: Role){
      let dialogRef = this.dialog.open(RoleFormComponent, { data: {role: role, title: 'Rolle Bearbeiten', confirmationText: "Bearbeiten"}, minWidth: '700px'});
      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
        this.store.dispatch(RoleActions.updateRole({role: result}));
      });
    }
  
    deleteRole(role: Role){
      let dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: `Rolle ${role.name} Löschen`});
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.store.dispatch(RoleActions.deleteRole({role: role}));
      });
    }

}
