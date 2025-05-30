// src/app/modals/modal-admin-events/modal-admin-events.component.ts

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
  form: FormGroup;
  minDate = new Date();

  pacientes: { dni: string; nombre: string; email: string }[] = [];
  especialidades: string[] = [
    'Odontólogo',
    'Odontopediatra',
    'Periodoncista',
    'Endodoncista',
    'Ortodoncista',
    'Cirujano Maxilofacial',
    'Higienista'
  ];

  /** Todas las citas cargadas */
  private allEvents: Events[] = [];

  /** Horas filtradas para el día */
  availableHours: string[] = [];

  private subs = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<ModalAdminEventsComponent>,
    private fb: FormBuilder,
    private modalSvc: ModalEventsService,
    @Inject(MAT_DIALOG_DATA) public data: Events
  ) {
    // Inicializar form
    this.form = this.fb.group({
      nombreEvento: [this.data?.name || '', [Validators.required, Validators.pattern(/^.{1,10}$/)]],
      paciente: [null, Validators.required],
      especialidad: [this.data?.type || '', Validators.required],
      id: [this.data?.id || crypto.randomUUID(), Validators.required],
      date: [this.data?.date || new Date(), Validators.required],
      hora: [
        this.data?.date
          ? `${new Date(this.data.date).getHours().toString().padStart(2, '0')}:00`
          : '',
        Validators.required
      ],
      background: [this.data?.background || '#ffffff'],
      color: [this.data?.color || '#000000']
    });
  }

  async ngOnInit(): Promise<void> {
    // Carga inicial de pacientes
    await this.loadPacientes();

    // Si editando, parchea paciente
    if (this.data?.patientDni) {
      const sel = this.pacientes.find(p => p.dni === this.data!.patientDni);
      if (sel) this.form.patchValue({ paciente: sel });
    }

    // Suscríbete a los eventos globales
    this.subs.add(
      this.modalSvc.events$.subscribe(evts => {
        this.allEvents = evts;
        this.updateAvailableHours();
      })
    );

    // Cada vez que cambie la fecha, recalcule horas
    this.subs.add(
      this.form.get('date')!.valueChanges.subscribe(() => {
        this.updateAvailableHours();
        // limpiar hora seleccionada para forzar re-selección
        this.form.patchValue({ hora: '' });
      })
    );

    // Primer cálculo
    this.updateAvailableHours();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Carga pacientes desde Firestore (solo una vez) */
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
    });
}

  /** Lista base de horas */
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

  /** Filtra las horas ya ocupadas en la fecha seleccionada */
  private updateAvailableHours() {
    const date: Date = this.form.get('date')!.value;
    const dayStr = date.toDateString();

    // Extrae horas ocupadas (excluyendo la cita actual si estamos editando)
    const occupied = this.allEvents
      .filter(ev => ev.date.toDateString() === dayStr && ev.id !== this.data?.id)
      .map(ev => ev.date.getHours().toString().padStart(2, '0') + ':00');

    // Horas libres
    this.availableHours = this.baseHours().filter(h => !occupied.includes(h));

    // Si estamos editando y la hora original no está, añádela al inicio
    const curr = this.form.get('hora')!.value;
    if (curr && !this.availableHours.includes(curr)) {
      this.availableHours.unshift(curr);
    }
  }

  save() {
    if (this.form.valid) {
      const v = this.form.value;
      const dt = new Date(v.date);
      dt.setHours(parseInt(v.hora), 0, 0, 0);

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

      this.dialogRef.close({ action: this.data ? 'modified' : 'added', event: ev });
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  delete() {
    this.dialogRef.close({ action: 'deleted', event: this.data! });
  }
}
