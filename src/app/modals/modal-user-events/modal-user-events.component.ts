// modal-user-events.component.ts
import { Component, OnInit, OnDestroy,Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { getFirestore, query, where, collection, getDocs } from 'firebase/firestore';
import { AuthService } from '../../services/user/auth.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModalEventsService } from '../../services/calendar/modal-events.service';
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
  form: FormGroup;
  minDate = new Date();

  especialidades: string[] = [
    'Odontólogo',
    'Odontopediatra',
    'Periodoncista',
    'Endodoncista',
    'Ortodoncista',
    'Cirujano Maxilofacial',
    'Higienista',
  ];

  private allEvents: Events[] = [];
  availableHours: string[] = [];
  currentUser: { dni: string; nombre: string; email: string } | null = null;
  private subs = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<ModalUserEventsComponent>,
    private fb: FormBuilder,
    private modalSvc: ModalEventsService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: Events
  ) {
    this.form = this.fb.group({
      nombreEvento: ['', Validators.required],
      especialidad: ['', Validators.required],
      id: [crypto.randomUUID(), Validators.required],
      date: [new Date(), Validators.required],
      hora: ['', Validators.required],
      background: ['#ffffff'],
      color: ['#000000'],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadCurrentUser();

    // Suscripción a eventos
    this.subs.add(
      this.modalSvc.events$.subscribe(evts => {
        this.allEvents = evts;
        this.updateAvailableHours();
      })
    );

    // Recalcular horas cuando cambie la fecha
    this.subs.add(
      this.form.get('date')!.valueChanges.subscribe(() => {
        this.updateAvailableHours();
        this.form.patchValue({ hora: '' });
      })
    );

    this.updateAvailableHours();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private async loadCurrentUser() {
    const email = this.authService.getCurrentEmail();
    if (!email) return;

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

  private baseHours(): string[] {
    const hrs: string[] = [];
    for (let h = 10; h < 14; h++) hrs.push(`${h.toString().padStart(2, '0')}:00`);
    for (let h = 16; h < 20; h++) hrs.push(`${h.toString().padStart(2, '0')}:00`);
    return hrs;
  }

  private updateAvailableHours() {
    const date: Date = this.form.get('date')!.value;
    const dayStr = date.toDateString();
    const occupied = this.allEvents
      .filter(ev => ev.date.toDateString() === dayStr)
      .map(ev => ev.date.getHours().toString().padStart(2, '0') + ':00');
    this.availableHours = this.baseHours().filter(h => !occupied.includes(h));
  }

  save() {
    if (this.form.valid && this.currentUser) {
      const v = this.form.value;
      const dt = new Date(v.date);
      dt.setHours(parseInt(v.hora), 0, 0, 0);

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

      this.dialogRef.close({ action: this.data ? 'modified' : 'added', event: ev });
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  delete() {
    if (this.data) {
      this.dialogRef.close({ action: 'deleted', event: this.data });
    }
  }
}
