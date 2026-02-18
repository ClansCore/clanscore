import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../core/dialogs/confirmation-dialog/confirmation-dialog.component';
import { EventTableComponent } from '../../components/event-table/event-table.component';
import { EventFormComponent } from '../../components/event-form/event-form.component';
import { EventActions, EventSelectors } from '../../store';
import { GuildEvent } from '../../../../core/models/domain/event.model';

@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [EventTableComponent, EventFormComponent, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './event-page.component.html',
  styleUrl: './event-page.component.scss'
})
export class EventPageComponent implements OnInit {
  private store = inject(Store);
  readonly dialog = inject(MatDialog);
  events = this.store.selectSignal(EventSelectors.selectEvents);
  loading = this.store.selectSignal(EventSelectors.selectEventsLoading);
  
  ngOnInit() {
      this.store.dispatch(EventActions.getEvents());
  }

  addEvent(){
      let dialogRef = this.dialog.open(EventFormComponent, { data: {event: {}, title: "Event Hinzufügen", confirmationText: "Hinzufügen"}, minWidth: '700px'});
      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
        this.store.dispatch(EventActions.addEvent({event: result}));
      });
    }

  viewEvent(event: GuildEvent){
    this.dialog.open(EventFormComponent, { data: {event: event, title: 'Event Ansicht', confirmationText: "Ok"}, minWidth: '700px'});
  }

  editEvent(event: GuildEvent){
      let dialogRef = this.dialog.open(EventFormComponent, { data: {event: event, title: 'Event Bearbeiten', confirmationText: "Bearbeiten"}, minWidth: '700px'});
      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
        this.store.dispatch(EventActions.updateEvent({event: result}));
      });
    }
  
    deleteEvent(event: GuildEvent){
      let dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: `Event ${event.name} Löschen`});
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.store.dispatch(EventActions.deleteEvent({event: event}));
      });
    }

}
