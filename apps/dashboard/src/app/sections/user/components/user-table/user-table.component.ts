import { Component, EventEmitter, input, Input, OnChanges, output, Output, signal, SimpleChanges } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import {MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.scss'
})
export class UserTableComponent {
  displayedColumns: string[] = ['firstName', 'lastName', 'nickname', 'birthdate', 'actions'];
  dataSource = signal<User[]>([]);

  @Input()
  set users(users: User[]){
    this.dataSource.set(users)
  }
   @Output() updateMember = new EventEmitter<User>();

   @Output() deleteMember = new EventEmitter<User>();
}
