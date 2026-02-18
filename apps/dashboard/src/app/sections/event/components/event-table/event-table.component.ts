import { Component, EventEmitter, input, Input, OnChanges, output, Output, signal, SimpleChanges } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import {MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GuildEvent } from '../../../../core/models/domain/event.model';

@Component({
  selector: 'app-event-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule],
  templateUrl: './event-table.component.html',
  styleUrl: './event-table.component.scss'
})
export class EventTableComponent {
  displayedColumns: string[] = ['name', 'description', 'actions']; // 'actions'
  dataSource = signal<GuildEvent[]>([]);

  @Input()
  set events(events: GuildEvent[]){
    this.dataSource.set(events)
  }
  
  @Output() viewEvent = new EventEmitter<GuildEvent>();

  @Output() updateEvent = new EventEmitter<GuildEvent>();

  @Output() deleteEvent = new EventEmitter<GuildEvent>();
}
