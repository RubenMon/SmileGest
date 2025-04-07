import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalEventsComponent } from '../../modals/modal-events/modal-events.component';
import { Events } from '../../interfaces/events.interface';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ModalEventsService {
  private modalData = signal<Events | null>(null);
  private dialog = inject(MatDialog);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  constructor() { }

  openModal(data?: Events): void {
    const dialogRef = this.dialog.open(ModalEventsComponent, {
      data,
      width: '70vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.setEvent(result);
      }
    });
  }

  get getEvent(): Events | null {
    return this.modalData();
  }

  async setEvent(event: Events) {
    const user = this.auth.currentUser;
    if (!user) return;

    const eventsCollection = collection(this.firestore, 'events');

    let assignedUserId = user.uid; // Por defecto, el usuario actual

    const isAdmin = user.email === 'admin@clinicadental.com';

    if (isAdmin && event.dni) {
      // Si es admin y especifica un DNI, buscamos el usuario por DNI
      const usersCollection = collection(this.firestore, 'users');
      const q = query(usersCollection, where('dni', '==', event.dni));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        assignedUserId = userDoc.id;
      } else {
        console.error('No se encontró ningún usuario con ese DNI');
        return; // Opcional: podrías lanzar un toast o alerta aquí
      }
    }

    if (!event.id) {
      // Crear nuevo evento
      const newEvent = {
        ...event,
        userId: assignedUserId,
        createdAt: new Date()
      };
      await addDoc(eventsCollection, newEvent);
    } else {
      // Actualizar evento existente
      const eventDoc = doc(this.firestore, `events/${event.id}`);
      await updateDoc(eventDoc, { ...event, userId: assignedUserId });
    }

    this.modalData.set(event);
  }

  getAllEvents() {
    const user = this.auth.currentUser!;

    const eventsCollection = collection(this.firestore, 'events');

    const isAdmin = user.email === 'admin@clinicadental.com';

    const q = isAdmin
      ? eventsCollection
      : query(eventsCollection, where('userId', '==', user.uid));

    return collectionData(q, { idField: 'id' }).pipe(
      map(data => data as Events[])
    );
  }


  async deleteEvent(eventId: string) {
    const eventDoc = doc(this.firestore, `events/${eventId}`);
    await deleteDoc(eventDoc);
  }
}
