import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { getFirestore, query, where, collection, getDocs } from 'firebase/firestore';
import { AuthService } from '../../services/user/auth.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Events } from '../../interfaces/events.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { NgxColorsModule } from 'ngx-colors';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { collectionData, Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-modal-user-events',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    NgxColorsModule,
    MatTooltipModule,
    MatIconModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './modal-user-events.component.html',
  styleUrls: ['./modal-user-events.component.css'],
})
export class ModalUserEventsComponent implements OnInit, OnDestroy {
  // Formulario reactivo para crear o editar eventos
  form: FormGroup;
  // Fecha mínima seleccionable en el datepicker (hoy)
  minDate = new Date();

  // Lista de especialidades disponibles para el evento
  especialidades: string[] = [
    'Odontólogo',
    'Odontopediatra',
    'Periodoncista',
    'Endodoncista',
    'Ortodoncista',
    'Cirujano Maxilofacial',
    'Higienista',
  ];

  private allEvents: Events[] = [];  // Todos los eventos cargados para evitar solapamientos
  // Horas disponibles para la fecha seleccionada
  availableHours: string[] = [];
  // Usuario actual autenticado
  currentUser: { dni: string; nombre: string; email: string } | null = null;

  // Para manejar múltiples suscripciones y limpiarlas
  private subs = new Subscription();

  constructor(
  public dialogRef: MatDialogRef<ModalUserEventsComponent>,
  private fb: FormBuilder,
  private authService: AuthService,
  @Inject(MAT_DIALOG_DATA) public data?: Events
) {
  const initDate = data ? new Date(data.date) : new Date();
  const initHora = data
    ? initDate.getHours().toString().padStart(2,'0') + ':' + initDate.getMinutes().toString().padStart(2,'0')
    : '';

  this.form = this.fb.group({
    nombreEvento: [data?.name || '', [Validators.required, Validators.pattern(/^.{1,10}$/)]],
    especialidad: [data?.type || '', Validators.required],
    id: [data?.id || crypto.randomUUID(), Validators.required],
    date: [initDate, Validators.required],
    hora: [initHora, Validators.required],
    background: [data?.background || '#ffffff'],
    color: [data?.color || '#000000'],
  });
}

  async ngOnInit(): Promise<void> {
    // Carga datos del usuario actual para asignar al evento
    await this.loadCurrentUser();

    // Carga todos los eventos existentes para calcular horas disponibles
    this.loadAllEvents();

    // Suscripción para actualizar horas disponibles cuando cambie la fecha en el formulario
    this.subs.add(
      this.form.get('date')!.valueChanges.subscribe(() => {
        this.updateAvailableHours();
        this.form.patchValue({ hora: '' });
      })
    );

    // Inicializa las horas disponibles en el momento de crear el modal
    this.updateAvailableHours();
  }

  ngOnDestroy(): void {
    // Limpia todas las suscripciones para evitar fugas de memoria
    this.subs.unsubscribe();
  }

  /**
   * Obtiene el usuario actual autenticado desde Firestore por su email
   */
  private async loadCurrentUser() {
    const email = this.authService.getCurrentEmail();
    if (!email) return;  // Si no hay email, no hace nada

    const db = getFirestore();
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      this.currentUser = {
        dni: docData['dni'],
        nombre: docData['nombreCompleto']?.split(' ')[0] || '',
        email: docData['email'],
      };
    }
  }

  /**
   * Obtiene todos los eventos almacenados en Firestore para luego filtrar horas ocupadas
   */
  private loadAllEvents() {
    const db = getFirestore();
    const eventsCollection = collection(db, 'events');
    // collectionData devuelve un Observable con los documentos de 'events'
    const eventsData = collectionData(eventsCollection, { idField: 'id' });

    // Suscripción para actualizar el arreglo de eventos y recalcular horas disponibles
    this.subs.add(eventsData.subscribe((rawEvents: any[]) => {
      this.allEvents = rawEvents.map(e => ({
        id: e.id,
        name: e.name,
        patientName: e.patientName,
        patientDni: e.patientDni,
        patientEmail: e.patientEmail,
        type: e.type,
        background: e.background,
        color: e.color,
        date: (e.date as Timestamp).toDate(),
      }));
      this.updateAvailableHours();
    }));
  }

  /**
   * Devuelve las horas base disponibles en el rango laboral
   */
  private baseHours(): string[] {
    const hrs: string[] = [];
    for (let h = 10; h < 14; h++) hrs.push(`${h.toString().padStart(2, '0')}:00`);
    for (let h = 16; h < 20; h++) hrs.push(`${h.toString().padStart(2, '0')}:00`);
    return hrs;
  }

  /**
   * Actualiza la lista de horas disponibles para la fecha seleccionada,
   * eliminando las horas ya ocupadas por otros eventos
   */
  private updateAvailableHours() {
    const date: Date = this.form.get('date')!.value;
    const dayStr = date.toDateString();

    // Obtiene las horas ocupadas ese día
    const occupied = this.allEvents
      .filter(ev => ev.date.toDateString() === dayStr)
      .map(ev => ev.date.getHours().toString().padStart(2, '0') + ':00');

    // Filtra las horas base para eliminar las ocupadas
    this.availableHours = this.baseHours().filter(h => !occupied.includes(h));
  }

  /**
   * Guarda el evento, cerrando el modal y enviando los datos
   */
  save() {
    if (this.form.valid && this.currentUser) {
      const v = this.form.value;
      const dt = new Date(v.date);
      dt.setHours(parseInt(v.hora), 0, 0, 0);

      // Construye el objeto evento para guardar o actualizar
      const ev: Events = {
        id: v.id,
        name: v.nombreEvento,
        patientName: this.currentUser.nombre,
        patientDni: this.currentUser.dni,
        patientEmail: this.currentUser.email,
        type: v.especialidad,
        date: dt,
        background: v.background,
        color: v.color,
      };

      // Cierra el diálogo enviando la acción (añadido o modificado) y el evento
      this.dialogRef.close({ action: this.data ? 'modified' : 'added', event: ev });
    }
  }

  /**
   * Cierra el modal sin guardar cambios
   */
  cancelar() {
    this.dialogRef.close();
  }

  /**
   * Elimina el evento actual si existe y cierra el modal notificando la acción
   */
  delete() {
    if (this.data) {
      this.dialogRef.close({ action: 'deleted', event: this.data });
    }
  }
}
