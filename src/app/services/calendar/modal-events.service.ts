import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalEventsComponent } from '../../modals/modal-events/modal-events.component';
import { Events } from '../../interfaces/events.interface';

@Injectable({
  providedIn: 'root'
})
export class ModalEventsService {
  private modalData = signal<Events | null>(null);
  private dialog = inject(MatDialog);
  private storageKey = 'calendarEvents';

  constructor() {
    this.loadEvents();
  }

  openModal(data?: Events): void {
    const dialogRef = this.dialog.open(ModalEventsComponent, {
      data,
      width: '70vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.setEvent(result);
        this.saveEvents();
      }
    });
  }

  get getEvent(): Events | null {
    return this.modalData();
  }

  setEvent(event: Events) {
    this.modalData.set(event);
    this.saveEvents();
  }

  getAllEvents(): Events[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  saveEvents() {
    const allEvents = this.getAllEvents();
    const updatedEvent = this.getEvent;
    if (updatedEvent) {
      const index = allEvents.findIndex(e => e.id === updatedEvent.id);
      if (index !== -1) {
        allEvents[index] = updatedEvent;
      } else {
        allEvents.push(updatedEvent);
      }
    }
    localStorage.setItem(this.storageKey, JSON.stringify(allEvents));
  }

  loadEvents() {
    const events = this.getAllEvents();
    if (events.length > 0) {
      this.modalData.set(events[events.length - 1]);
    }
  }

  deleteEvent(eventId: string) {
    let events = this.getAllEvents();
    events = events.filter(e => e.id !== eventId);
    localStorage.setItem(this.storageKey, JSON.stringify(events));
  }
}
