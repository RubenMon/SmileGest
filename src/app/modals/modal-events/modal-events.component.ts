import { Component, Inject, OnInit, inject,} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { ModalEventsService } from '../../services/calendar/modal-events.service';
import { Events } from '../../interfaces/events.interface';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatButton } from '@angular/material/button';
import { NgxColorsModule } from 'ngx-colors';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { NgStyle } from '@angular/common';


@Component({
  selector: 'app-modal-events',
  standalone: true,
  imports: [MatDatepickerModule, MatInputModule, MatSelectModule, ReactiveFormsModule, MatDialogActions, MatDialogContent, MatDialogClose, MatFormFieldModule, MatDialogTitle, MatButtonModule, MatButton, NgxColorsModule, MatTooltip, MatIcon, NgStyle,],
  providers: [provideNativeDateAdapter()],
  templateUrl: './modal-events.component.html',
  styleUrl: './modal-events.component.scss'
})
export class ModalEventsComponent implements OnInit {
  date = new Date();
  minDate = new Date();
  // maxDate = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0);
  form: FormGroup = new FormGroup({});

  constructor(
    private dialogRef: MatDialogRef<ModalEventsComponent>,
    private fb: FormBuilder,
    private modalSvc: ModalEventsService,
    @Inject(MAT_DIALOG_DATA) public data: Events
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data?.name || '', [Validators.required]],
      type: [this.data?.type || '', [Validators.required]],
      // icon: [this.data?.icon || '',],
      id: [this.data?.id || crypto.randomUUID(), [Validators.required]],
      date: [this.data?.date || new Date(), [Validators.required]],
      background: [this.data?.background || 'white'],
      color: [this.data?.color]
    });
  }

  save() {
    if (this.form.valid) {
      this.modalSvc.setEvent(this.form.value);
      this.dialogRef.close(this.form.value);
    }
  }
}
