import { Injectable, inject, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Events } from '../../interfaces/events.interface';

@Injectable({ providedIn: 'root' })
export class ModalEventsService {
  private modalData = signal<Events | null>(null);
  private dialog = inject(MatDialog);
  private storageKey = 'calendarEvents';
  dialogRef: MatDialogRef<any> | null = null;  // Guardar dialogRef

  openModal(component: any, data?: Events): void {
    this.dialogRef = this.dialog.open(component, {
      data,
      width: '70vw'
    });

    // Suscripción al cierre del modal
    this.dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si el evento es nuevo o modificado
        if (result.action === 'modified' || result.action === 'added') {
          this.setEvent(result.event);
        } else if (result.action === 'deleted') {
          // Si se eliminó el evento
          this.deleteEvent(result.event.id);
        }
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
        allEvents[index] = updatedEvent; // Modificamos el evento existente
      } else {
        allEvents.push(updatedEvent); // Agregamos un nuevo evento
      }
    }
    localStorage.setItem(this.storageKey, JSON.stringify(allEvents));
  }

  deleteEvent(eventId: string) {
    let events = this.getAllEvents();
    events = events.filter(e => e.id !== eventId); // Filtramos el evento a eliminar
    localStorage.setItem(this.storageKey, JSON.stringify(events));
  }
}
