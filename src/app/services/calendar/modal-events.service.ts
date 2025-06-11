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
import { getDocs, query, where } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class ModalEventsService {
  // Inyecciones de dependencias
  private dialog = inject(MatDialog);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  dialogRef: MatDialogRef<any> | null = null;

  // BehaviorSubject para manejar los eventos de manera reactiva
  private eventsSubject = new BehaviorSubject<Events[]>([]);
  events$ = this.eventsSubject.asObservable();

  constructor() {
    // Si el usuario es administrador, carga todos los eventos,
    // si no, carga solo los eventos del usuario actual.
    if (this.authService.getCurrentEmail() == 'administracionclinica@gmail.com') {
      this.loadAllEvents();
    } else {
      this.loadUserEvents();
    }
  }

  /**
   * Abre un modal (diálogo) con el componente indicado y opcionalmente datos de evento.
   * Luego, escucha el cierre del modal para realizar acciones según resultado.
   */
  openModal(component: any, data?: Events): void {
    this.dialogRef = this.dialog.open(component, {
      data,
      width: '70vw'
    });

    // Cuando se cierre el modal, se procesa la acción resultante (agregar, modificar, eliminar)
    this.dialogRef.afterClosed().subscribe(async result => {
      if (!result) return; // Si no hay resultado, no hacer nada

      const ev: Events = result.event;
      if (result.action === 'added' || result.action === 'modified') {
        // Guardar evento en Firestore
        await this.saveEventToFirestore(ev);
      } else if (result.action === 'deleted') {
        // Eliminar evento de Firestore
        await this.deleteEventFromFirestore(ev.id);
      }
    });
  }

  /**
   * Carga todos los eventos de la colección 'events' en Firestore.
   * Luego emite los eventos para que se actualicen los observables suscritos.
   */
  private loadAllEvents() {
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
       // Actualizar observable con los eventos cargados
      this.eventsSubject.next(evts);
    });
  }

  /**
   * Carga solo los eventos asociados al usuario actualmente autenticado.
   * Primero obtiene el DNI del usuario desde la colección 'users' usando su email,
   * luego busca eventos que coincidan con ese DNI.
   */
  private loadUserEvents() {
    const email = this.authService.getCurrentEmail();  // Email del usuario logueado

    if (email) {
      // Query para buscar el usuario en 'users' según su email
      const userRef = query(collection(this.firestore, 'users'), where('email', '==', email));

      getDocs(userRef).then(snapshot => {
        if (!snapshot.empty) {
          const user = snapshot.docs[0].data();
          const dni = user['dni'];

          // Buscar eventos que tengan ese 'patientDni'
          const eventsCollection = collection(this.firestore, 'events');
          const eventsQuery = query(eventsCollection, where('patientDni', '==', dni));

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
            // Emitir eventos filtrados
            this.eventsSubject.next(evts);
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

  /**
   * Guarda o actualiza un evento en Firestore.
   * Convierte la fecha JS Date a Timestamp para Firestore.
   */
  async saveEventToFirestore(event: Events): Promise<void> {
    const eventRef = doc(this.firestore, 'events', event.id);
    const payload = {
      ...event,
      date: Timestamp.fromDate(event.date)
    };
    await setDoc(eventRef, payload, { merge: true });
  }

  /**
   * Elimina un evento de Firestore dado su ID.
   */
  async deleteEventFromFirestore(eventId: string): Promise<void> {
    const eventRef = doc(this.firestore, 'events', eventId);
    await deleteDoc(eventRef);
  }
}
