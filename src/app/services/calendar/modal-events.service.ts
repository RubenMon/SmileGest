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
import { AuthService } from '../user/auth.service';
import { getDocs,getFirestore, query, where } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class ModalEventsService {
  private dialog = inject(MatDialog);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  dialogRef: MatDialogRef<any> | null = null;

  private eventsSubject = new BehaviorSubject<Events[]>([]);
  events$ = this.eventsSubject.asObservable();

  constructor() {
    if (this.authService.getCurrentEmail() == 'administracionclinica@gmail.com') {
      this.loadAllEvents();
    }else {
      this.loadUserEvents();
    }
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

private loadAllEvents() {
  // Método para obtener todos los eventos
  const eventsCollection = collection(this.firestore, 'events');
  collectionData(eventsCollection, { idField: 'id' }).subscribe((rawEvents: any[]) => {
    const evts: Events[] = rawEvents.map(e => ({
      id:          e.id,
      name:        e.name,
      patientName: e.patientName,
      patientDni:  e.patientDni,
      patientEmail:e.patientEmail,
      type:        e.type,
      background:  e.background,
      color:       e.color,
      date:        (e.date as Timestamp).toDate()
    }));
    this.eventsSubject.next(evts); // Emite los eventos para que se actualice el observable
  });
}

private loadUserEvents() {
  const email = this.authService.getCurrentEmail();  // Obtener el email del usuario logueado

  if (email) {
    // Buscar el usuario en la colección "users" para obtener el DNI
    const userRef = query(collection(this.firestore, 'users'), where('email', '==', email));

    getDocs(userRef).then(snapshot => {
      if (!snapshot.empty) {
        const user = snapshot.docs[0].data();
        const dni = user['dni'];  // Obtener el DNI del usuario

        // Ahora, busca los eventos con el "dni" correspondiente
        const eventsCollection = collection(this.firestore, 'events');
        const eventsQuery = query(eventsCollection, where('patientDni', '==', dni));

        // Obtener los eventos filtrados por 'patientDni'
        collectionData(eventsQuery, { idField: 'id' }).subscribe((rawEvents: any[]) => {
          const evts: Events[] = rawEvents.map(e => ({
            id:          e.id,
            name:        e.name,
            patientName: e.patientName,
            patientDni:  e.patientDni,
            patientEmail:e.patientEmail,
            type:        e.type,
            background:  e.background,
            color:       e.color,
            date:        (e.date as Timestamp).toDate()
          }));
          this.eventsSubject.next(evts);  // Emite los eventos para que se actualicen en el observable
        });
      } else {
        console.error('Usuario no encontrado en la colección users');
      }
    }).catch(error => {
      console.error('Error al obtener el usuario:', error);
    });
  } else {
    console.error('No hay usuario logueado');
  }
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
