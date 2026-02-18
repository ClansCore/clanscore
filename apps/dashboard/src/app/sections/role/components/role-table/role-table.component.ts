import { Component, EventEmitter, input, Input, OnChanges, output, Output, signal, SimpleChanges } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import {MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../../../core/models/domain/role.model';

@Component({
  selector: 'app-role-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule],
  templateUrl: './role-table.component.html',
  styleUrl: './role-table.component.scss'
})
export class RoleTableComponent {
  displayedColumns: string[] = ['name', 'discordposition', 'actions'];
  dataSource = signal<Role[]>([]);

  @Input()
  set roles(roles: Role[]){
    this.dataSource.set(roles)
  }
  
   @Output() updateRole = new EventEmitter<Role>();

   @Output() deleteRole = new EventEmitter<Role>();

   protected readonly protectedRoleNames = ['Vorstand', 'Mitglied', 'Admin'];

   isProtectedRole(role: Role): boolean {
     return this.protectedRoleNames.includes(role.name);
   }
}
