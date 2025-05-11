import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogContent } from '@angular/material/dialog';
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
export class ModalAdminEventsComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  date = new Date();
  minDate = new Date();

  pacientes: { dni: string; nombre: string }[] = [];
  especialidades: string[] = [
    'Odontólogo',
    'Odontopediatra',
    'Periodoncista',
    'Endodoncista',
    'Ortodoncista',
    'Cirujano Maxilofacial',
    'Higienista'
  ];
  availableHours: string[] = [];
  eventToDelete: Events | null = null;

  constructor(
    public dialogRef: MatDialogRef<ModalAdminEventsComponent>,
    private fb: FormBuilder,
    private modalSvc: ModalEventsService,
    @Inject(MAT_DIALOG_DATA) public data: Events
  ) {}

  async ngOnInit(): Promise<void> {
    this.eventToDelete = this.data || null;

    this.form = this.fb.group({
      nombreEvento: [this.data?.name || '', Validators.required],
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

    await this.loadPacientes();

    if (this.data?.patientDni) {
      const selectedPaciente = this.pacientes.find(p => p.dni === this.data!.patientDni);
      if (selectedPaciente) {
        this.form.patchValue({ paciente: selectedPaciente });
      }
    }

    this.generateAvailableHours();
}


async loadPacientes() {
  const db = getFirestore();
  const usersSnapshot = await getDocs(collection(db, 'users'));
  this.pacientes = usersSnapshot.docs.map(doc => {
    const data = doc.data();
    const nombreCompleto = data['nombreCompleto']?.trim() || '';
    const primerNombre = nombreCompleto.split(' ')[0];

    return {
      dni: data['dni'],
      nombre: primerNombre
    };
  });
}

  generateAvailableHours() {
    const hours: string[] = [];

    // Mañana: 10:00 - 14:00
    for (let h = 10; h < 14; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // Tarde: 16:00 - 20:00
    for (let h = 16; h < 20; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }

    this.availableHours = hours;
  }

  save() {
    if (this.form.valid) {
      const values = this.form.value;

      const eventDate = new Date(values.date);
      eventDate.setHours(parseInt(values.hora), 0, 0, 0);

      const event: Events = {
        id: values.id,
        name: values.nombreEvento,
        patientName: values.paciente.nombre,
        patientDni: values.paciente.dni,
        type: values.especialidad,
        date: eventDate,
        background: values.background,
        color: values.color
      };

      this.modalSvc.setEvent(event);
      this.dialogRef.close(event);
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  delete() {
    this.dialogRef.close('deleted');
  }

}
