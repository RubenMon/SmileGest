import { Component, OnInit, inject, effect } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Calendar } from '../../interfaces/calendar.interface';
import { Events } from '../../interfaces/events.interface';
import { DatePipe, NgClass, NgStyle, NgIf, NgFor } from '@angular/common';
import { ModalEventsService } from '../../services/calendar/modal-events.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DeleteComponent } from '../../modals/delete/delete.component';
import { MatDialog } from '@angular/material/dialog';
import { getAuth } from 'firebase/auth';
import { ModalAdminEventsComponent } from '../../modals/modal-admin-events/modal-admin-events.component';
import { ModalEventsComponent } from '../../modals/modal-events/modal-events.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    MatButton,
    MatIconButton,
    MatIcon,
    MatMenuModule,
    NgClass,
    NgStyle,
    NgIf,
    NgFor,
    DatePipe,
    MatTooltip,
    DeleteComponent
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  private modalSvc = inject(ModalEventsService);
  private dialog = inject(MatDialog);

  nameDay = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  calendarDays: Calendar[] = [];
  weekDays: Calendar[] = [];
  allEvents: Events[] = [];
  currentMonthAndYear?: string;
  currentWeekRange?: string;
  viewMode: 'month' | 'week' = 'month';
  private date = new Date();

  constructor() {
    this.checkForNewEvents();
  }

  ngOnInit(): void {
    this.initializeCalendar();
  }

  toggleView(mode: 'month' | 'week') {
    this.viewMode = mode;
    this.initializeCalendar();
  }

  /**
   * Crea o edita un evento.
   * Si pasa `ev`, se edita; si no, se abre modal en blanco.
   */
showEventModal(ev?: Events, i?: number, j?: number) {
  const user = getAuth().currentUser;
  const isAdmin = user?.email === 'administracionclinica@gmail.com';
  const ModalComp = isAdmin
    ? ModalAdminEventsComponent
    : ModalEventsComponent;

  // Llamamos a openModal pasándole también los índices
  this.modalSvc.openModal(ModalComp, ev);

  // Suscribimos a la acción de cierre del modal usando el dialogRef
  if (this.modalSvc.dialogRef) {
    this.modalSvc.dialogRef.afterClosed().subscribe(result => {
      if (result === 'deleted' && ev && i !== undefined && j !== undefined) {
        this.removeEvent(i, j); // Llamamos a removeEvent para actualizar el calendario
      }
    });
  }
}



  removeEvent(i: number, j: number) {
    const dialogRef = this.dialog.open(DeleteComponent);
    dialogRef.afterClosed().subscribe(ok => {
      if (!ok) return;
      const ev = (this.viewMode === 'month' ? this.calendarDays : this.weekDays)[i].events[j];
      this.allEvents = this.allEvents.filter(x => x.id !== ev.id);
      this.modalSvc.deleteEvent(ev.id);
      this.initializeCalendar();
    });
  }

  private initializeCalendar() {
    this.loadEvents();
    if (this.viewMode === 'month') {
      this.updateCurrentMonthAndYear();
      this.createCalendarDays();
    } else {
      this.updateCurrentWeekRange();
      this.createWeekDays();
    }
  }

  private checkForNewEvents() {
    effect(() => {
      const newEvent = this.modalSvc.getEvent;
      if (newEvent) this.createOrUpdateEvent(newEvent);
    });
  }

  private loadEvents() {
    this.allEvents = this.modalSvc.getAllEvents();
  }

  private createOrUpdateEvent(item: Events) {
    const idx = this.allEvents.findIndex(ev => ev.id === item.id);
    if (idx > -1) this.allEvents[idx] = item;
    else this.allEvents.push(item);
    this.initializeCalendar();
  }

  private updateCurrentMonthAndYear() {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.currentMonthAndYear = `${monthNames[this.date.getMonth()]} de ${this.date.getFullYear()}`;
  }

  previous() {
    if (this.viewMode === 'month') {
      this.date.setMonth(this.date.getMonth() - 1);
    } else {
      this.date.setDate(this.date.getDate() - 7);
    }
    this.initializeCalendar();
  }

  next() {
    if (this.viewMode === 'month') {
      this.date.setMonth(this.date.getMonth() + 1);
    } else {
      this.date.setDate(this.date.getDate() + 7);
    }
    this.initializeCalendar();
  }

  private createCalendarDays() {
    this.calendarDays = [];
    const year = this.date.getFullYear();
    const month = this.date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const jsDay = firstDayOfMonth.getDay();
    const blankDays = (jsDay + 6) % 7;

    for (let i = 0; i < blankDays; i++) {
      this.calendarDays.push({ day: null, currentDay: false, currentMonth: false, date: null!, events: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      this.calendarDays.push({
        day: d,
        currentDay: date.toDateString() === new Date().toDateString(),
        currentMonth: true,
        date,
        events: this.getEventsForDate(date)
      });
    }
  }

  private updateCurrentWeekRange() {
    const dt = new Date(this.date);
    const day = dt.getDay() || 7;
    const monday = new Date(dt.setDate(dt.getDate() - (day - 1)));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.currentWeekRange = `${monday.toLocaleDateString('es-ES')} - ${sunday.toLocaleDateString('es-ES')}`;
  }

  private createWeekDays() {
    this.weekDays = [];
    const dt = new Date(this.date);
    const day = dt.getDay() || 7;
    const monday = new Date(dt.setDate(dt.getDate() - (day - 1)));

    for (let i = 0; i < 7; i++) {
      const wd = new Date(monday);
      wd.setDate(monday.getDate() + i);
      this.weekDays.push({
        day: wd.getDate(),
        currentDay: wd.toDateString() === new Date().toDateString(),
        currentMonth: wd.getMonth() === this.date.getMonth(),
        date: wd,
        events: this.getEventsForDate(wd)
      });
    }
  }

  private getEventsForDate(date: Date) {
    return this.allEvents.filter(ev =>
      new Date(ev.date).toDateString() === date.toDateString()
    );
  }

  formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
