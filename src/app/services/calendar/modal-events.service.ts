import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Events } from '../../interfaces/events.interface';
import {
  Firestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  collectionData
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
    this.loadEventsFromFirestore(); // Cargar eventos al inicializar el servicio
  }

  openModal(component: any, data?: Events): void {
    this.dialogRef = this.dialog.open(component, {
      data,
      width: '70vw'
    });

    this.dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        const event = result.event;

        if (result.action === 'modified' || result.action === 'added') {
          await this.saveEventToFirestore(event);
        } else if (result.action === 'deleted') {
          await this.deleteEventFromFirestore(event.id);
        }
      }
    });
  }

  private loadEventsFromFirestore() {
    const eventsCollection = collection(this.firestore, 'events');
    collectionData(eventsCollection, { idField: 'id' }).subscribe(data => {
      this.eventsSubject.next(data as Events[]);
    });
  }

  async saveEventToFirestore(event: Events): Promise<void> {
    const eventRef = doc(this.firestore, 'events', event.id);
    await setDoc(eventRef, event, { merge: true });
  }

  async deleteEventFromFirestore(eventId: string): Promise<void> {
    const eventRef = doc(this.firestore, 'events', eventId);
    await deleteDoc(eventRef);
  }
}
