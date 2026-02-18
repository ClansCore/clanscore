import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { GuildEvent } from '../../../../core/models/domain/event.model';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogActions,
    MatDialogContent
  ],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss'
})
export class EventFormComponent {
  readonly dialogRef = inject(MatDialogRef<EventFormComponent>);
  readonly data = inject<{event: GuildEvent, title: string, confirmationText: string}>(MAT_DIALOG_DATA);
  eventForm;
    
  constructor(private fb: FormBuilder) {
    this.eventForm = this.fb.nonNullable.group({
      id: [''],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', Validators.required],
      location: [''],
      providerEventId: ['1'],
      discordEventId: ['1']
    });

    if(!this.data.event.id) return;

    this.eventForm.patchValue({
      id: this.data.event.id,
      name: this.data.event.name,
      description: this.data.event.description,
      startDate: this.data.event.startDate.toISOString(),
      endDate: this.data.event.endDate.toISOString(),
      startTime: this.toHHMM(this.data.event.startDate),
      endTime: this.toHHMM(this.data.event.endDate),
      location: this.data.event.location
    })
  }

  onSubmit(){
    const formValue = this.eventForm.getRawValue();
    const updateEvent : GuildEvent = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description,
      startDate: this.combineDateAndTime(formValue.startDate, formValue.startTime),
      endDate: this.combineDateAndTime(formValue.endDate, formValue.endTime),
      location: formValue.location,
      discordEventId: formValue.discordEventId,
      providerEventId: formValue.providerEventId,
    }
    this.dialogRef.close(updateEvent);
  }

  onCancel(){
    this.dialogRef.close(false);
  }

  toHHMM(date: Date): string {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}${m}`;
  }

  combineDateAndTime(dateStr: string, timeStr: string): Date {
    // Normalize to "HH:MM"
    if (timeStr.length === 4) {
      timeStr = timeStr.slice(0, 2) + ":" + timeStr.slice(2);
    }

    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(dateStr);

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
}

      
}
