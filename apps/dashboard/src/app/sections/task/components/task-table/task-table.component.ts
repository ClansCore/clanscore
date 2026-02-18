import { Component, EventEmitter, input, Input, OnChanges, OnInit, output, Output, signal, SimpleChanges } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import {MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '../../../../core/models/domain/task.model';

@Component({
  selector: 'app-task-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule],
  templateUrl: './task-table.component.html',
  styleUrl: './task-table.component.scss'
})
export class TaskTableComponent implements OnInit {
  displayedColumns: string[] = ['date', 'status', 'name', 'description', 'points', 'maxParticipants', 'actions'];
  dataSource = signal<Task[]>([]);
  currentDate: Date = new Date();

  @Input()
  set tasks(tasks: Task[]){
    this.dataSource.set(tasks)
  }
  
  @Output() viewTask = new EventEmitter<Task>();

  @Output() updateTask = new EventEmitter<Task>();

  @Output() deleteTask = new EventEmitter<Task>();

  ngOnInit(): void {
      this.currentDate = new Date();
  }

}
