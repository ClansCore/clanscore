import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { RoleSelectors } from '../../../role/store';
import { Role } from '../../../../core/models/domain/role.model';

@Component({
  selector: 'app-admin-user-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './admin-user-table.component.html',
  styleUrl: './admin-user-table.component.scss'
})
export class AdminUserTableComponent {
  private store = inject(Store);
  roles = this.store.selectSignal(RoleSelectors.selectRoles);
  
  displayedColumns: string[] = ['firstName', 'lastName', 'nickname', 'email', 'roles', 'actions'];
  dataSource = signal<User[]>([]);

  @Input()
  set users(users: User[]) {
    this.dataSource.set(users);
  }

  @Output() setPassword = new EventEmitter<User>();
  @Output() updateMember = new EventEmitter<User>();
  @Output() deleteMember = new EventEmitter<User>();

  getRoleNames(roleIds: string[]): string {
    if (!roleIds || roleIds.length === 0) {
      return '-';
    }
    const roleMap = new Map(this.roles().map(role => [role.id, role.name]));
    const roleNames = roleIds
      .map(id => roleMap.get(id))
      .filter(name => name !== undefined) as string[];
    return roleNames.length > 0 ? roleNames.join(', ') : '-';
  }

  hasVorstandRole(user: User): boolean {
    if (!user.roles || user.roles.length === 0) {
      return false;
    }
    const vorstandRole = this.roles().find(role => role.name === 'Vorstand');
    if (!vorstandRole) {
      return false;
    }
    return user.roles.includes(vorstandRole.id);
  }
}

