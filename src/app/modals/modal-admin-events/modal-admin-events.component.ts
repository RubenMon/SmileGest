import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
  MatDialogContent
} from '@angular/material/dialog';
import { ModalEventsService } from '../../services/calendar/modal-events.service';
import { Events } from '../../interfaces/events.interface';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { NgxColorsModule } from 'ngx-colors';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal-events',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    NgxColorsModule,
    MatTooltipModule,
    MatIconModule,
    MatDialogActions,
    MatDialogContent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './modal-admin-events.component.html',
  styleUrls: ['./modal-admin-events.component.css']
})
export class ModalAdminEventsComponent implements OnInit, OnDestroy {
  // Formulario reactivo para gestionar los datos del evento
  form: FormGroup;
  // Fecha mínima seleccionable en el datepicker (hoy o después)
  minDate = new Date();

  // Lista de pacientes cargada desde Firestore (dni, nombre y email)
  pacientes: { dni: string; nombre: string; email: string }[] = [];

  // Lista de especialidades disponibles para seleccionar en el formulario
  especialidades: string[] = [
    'Odontólogo',
    'Odontopediatra',
    'Periodoncista',
    'Endodoncista',
    'Ortodoncista',
    'Cirujano Maxilofacial',
    'Higienista'
  ];

  /** Todas las citas cargadas para evitar conflictos de horarios */
  private allEvents: Events[] = [];

  /** Horas disponibles para seleccionar según la fecha elegida */
  availableHours: string[] = [];

  /** Suscripciones a observables para limpiar al destruir componente */
  private subs = new Subscription();

  constructor(
     // Referencia al diálogo para cerrarlo
    public dialogRef: MatDialogRef<ModalAdminEventsComponent>,
     // Builder para crear el formulario reactivo
    private fb: FormBuilder,
     // Servicio que maneja eventos globales
    private modalSvc: ModalEventsService,
     // Datos inyectados para editar un evento existente
    @Inject(MAT_DIALOG_DATA) public data: Events
  ) {
    // Inicializa el formulario con valores por defecto o datos del evento a editar
    this.form = this.fb.group({
      // Nombre del evento con validación de 1 a 10 caracteres
      nombreEvento: [this.data?.name || '', [Validators.required, Validators.pattern(/^.{1,10}$/)]],
      // Paciente seleccionado (objeto)
      paciente: [null, Validators.required],
      // Especialidad seleccionada
      especialidad: [this.data?.type || '', Validators.required],
      // ID del evento, genera uno nuevo si no existe
      id: [this.data?.id || crypto.randomUUID(), Validators.required],
      // Fecha y hora del evento
      date: [this.data?.date || new Date(), Validators.required],
      // Hora en formato "HH:00" si hay fecha
      hora: [
        this.data?.date
          ? `${new Date(this.data.date).getHours().toString().padStart(2, '0')}:00`
          : '',
        Validators.required
      ],
      // Color de fondo para mostrar en calendario
      background: [this.data?.background || '#ffffff'],
      // Color de texto
      color: [this.data?.color || '#000000']
    });
  }

  /**
   * Hook que se ejecuta al inicializar el componente
   * - Carga la lista de pacientes desde Firestore
   * - Ajusta el paciente seleccionado si se está editando
   * - Se suscribe a cambios en eventos globales y en la fecha del formulario
   * - Actualiza las horas disponibles inicialmente
   */
  async ngOnInit(): Promise<void> {
    // Carga inicial de pacientes desde Firestore
    await this.loadPacientes();

    // Si estamos editando un evento, selecciona el paciente correspondiente
    if (this.data?.patientDni) {
      const sel = this.pacientes.find(p => p.dni === this.data!.patientDni);
      if (sel) this.form.patchValue({ paciente: sel });
    }

    // Suscripción para actualizar la lista de eventos global cuando cambie
    this.subs.add(
      this.modalSvc.events$.subscribe(evts => {
        this.allEvents = evts;
        this.updateAvailableHours(); // Recalcula horas libres
      })
    );

    // Suscripción a cambios en el campo fecha para recalcular horas disponibles
    this.subs.add(
      this.form.get('date')!.valueChanges.subscribe(() => {
        this.updateAvailableHours();
        // Resetea la hora seleccionada para forzar que se elija de nuevo
        this.form.patchValue({ hora: '' });
      })
    );

    // Primer cálculo de horas disponibles
    this.updateAvailableHours();
  }

  /**
   * Limpia todas las suscripciones para evitar fugas de memoria
   */
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /**
   * Carga la lista de pacientes desde Firestore
   * Solo se llama una vez al inicio
   * Se filtra para excluir al "Administrador"
   */
  async loadPacientes() {
    const db = getFirestore();
    const usersSnapshot = await getDocs(collection(db, 'users'));
    this.pacientes = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const nombreCompleto = data['nombreCompleto']?.trim() || '';
      const primerNombre = nombreCompleto.split(' ')[0];

      return {
        dni: data['dni'],
        nombre: primerNombre,
        email: data['correo'] || ''
      };
    })
    // Excluye administrador
    .filter(p => p.nombre !== 'Administrador');
  }

  /**
   * Devuelve la lista base de horas en las que se pueden agendar citas
   * Horas: 10:00 a 13:00 y 16:00 a 19:00
   */
  private baseHours(): string[] {
    const hrs: string[] = [];
    for (let h = 10; h < 14; h++) {
      hrs.push(`${h.toString().padStart(2, '0')}:00`);
    }
    for (let h = 16; h < 20; h++) {
      hrs.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return hrs;
  }

  /**
   * Actualiza las horas disponibles para la fecha seleccionada, excluyendo las horas ya ocupadas
   * También incluye la hora original si estamos editando y esa hora está ocupada
   */
  private updateAvailableHours() {
    const date: Date = this.form.get('date')!.value;
    const dayStr = date.toDateString();

    // Obtener horas ocupadas en la fecha, excepto la cita actual si se está editando
    const occupied = this.allEvents
      .filter(ev => ev.date.toDateString() === dayStr && ev.id !== this.data?.id)
      .map(ev => ev.date.getHours().toString().padStart(2, '0') + ':00');

    // Filtrar horas base para quedarse solo con las libres
    this.availableHours = this.baseHours().filter(h => !occupied.includes(h));

    // Si la hora actual del evento no está disponible (porque está ocupada), se agrega para que se pueda seleccionar
    const curr = this.form.get('hora')!.value;
    if (curr && !this.availableHours.includes(curr)) {
      this.availableHours.unshift(curr);
    }
  }

  /**
   * Guarda el evento al cerrar el diálogo, emitiendo los datos actualizados o nuevos
   * Solo si el formulario es válido
   */
  save() {
    if (this.form.valid) {
      const v = this.form.value;

      // Construir la fecha completa con la hora seleccionada
      const dt = new Date(v.date);
      dt.setHours(parseInt(v.hora), 0, 0, 0);

      // Crear el objeto Events con la información del formulario
      const ev: Events = {
        id: v.id,
        name: v.nombreEvento,
        patientName: v.paciente.nombre,
        patientDni: v.paciente.dni,
        patientEmail: v.paciente.email,
        type: v.especialidad,
        date: dt,
        background: v.background,
        color: v.color
      };

      // Cierra el diálogo enviando acción (modificado/agregado) y el evento
      this.dialogRef.close({ action: this.data ? 'modified' : 'added', event: ev });
    }
  }

  /** Cierra el diálogo sin hacer ninguna acción */
  cancelar() {
    this.dialogRef.close();
  }

  /** Cierra el diálogo indicando que se desea eliminar el evento */
  delete() {
    this.dialogRef.close({ action: 'deleted', event: this.data! });
  }
}
