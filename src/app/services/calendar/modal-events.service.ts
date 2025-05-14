// src/app/services/calendar/modal-events.service.ts

import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Events } from '../../interfaces/events.interface';
import {
  Firestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  collectionData,
  Timestamp
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalEventsService {
  private dialog = inject(MatDialog);
  private firestore = inject(Firestore);
  dialogRef: MatDialogRef<any> | null = null;

  private eventsSubject = new BehaviorSubject<Events[]>([]);
  events$ = this.eventsSubject.asObservable();

  constructor() {
    this.loadEventsFromFirestore(); // Carga inicial de eventos
  }

  openModal(component: any, data?: Events): void {
    this.dialogRef = this.dialog.open(component, {
      data,
      width: '70vw'
    });

    this.dialogRef.afterClosed().subscribe(async result => {
      if (!result) return;

      const ev: Events = result.event;
      if (result.action === 'added' || result.action === 'modified') {
        await this.saveEventToFirestore(ev);
      } else if (result.action === 'deleted') {
        await this.deleteEventFromFirestore(ev.id);
      }
    });
  }

  private loadEventsFromFirestore() {
    const eventsCollection = collection(this.firestore, 'events');
    collectionData(eventsCollection, { idField: 'id' }).subscribe(rawEvents => {
      const evts: Events[] = (rawEvents as any[]).map(e => ({
        id: e.id,
        name: e.name,
        patientName: e.patientName,
        patientDni: e.patientDni,
        patientEmail: e.patientEmail,
        type: e.type,
        background: e.background,
        color: e.color,
        // Convierte Timestamp de Firestore a JS Date
        date: (e.date as Timestamp).toDate()
      }));
      this.eventsSubject.next(evts);
    });
  }

  async saveEventToFirestore(event: Events): Promise<void> {
    const eventRef = doc(this.firestore, 'events', event.id);
    // Convierte JS Date a Firestore Timestamp
    const payload = {
      ...event,
      date: Timestamp.fromDate(event.date)
    };
    await setDoc(eventRef, payload, { merge: true });
  }

  async deleteEventFromFirestore(eventId: string): Promise<void> {
    const eventRef = doc(this.firestore, 'events', eventId);
    await deleteDoc(eventRef);
  }
}
