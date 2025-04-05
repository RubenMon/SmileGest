import { Component, OnInit, effect, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Calendar } from '../../interfaces/calendar.interface';
import { Events } from '../../interfaces/events.interface';
import { DatePipe, NgClass, NgStyle } from '@angular/common';
import { ModalEventsService } from '../../services/calendar/modal-events.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DeleteComponent } from '../../modals/delete/delete.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [MatButton, NgClass, MatTooltip, MatIcon, MatMenuModule, DatePipe, MatIconButton, NgStyle, DeleteComponent,],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  private modalSvc = inject(ModalEventsService);
  private dialog = inject(MatDialog);

  nameDay = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  calendarDays: Calendar[] = [];
  allEvents: Events[] = [];
  currentMonthAndYear?: string;

  private totalDays = 42;
  private date = new Date();

  constructor() {
    this.checkForNewEvents();
  }

  ngOnInit(): void {
    this.initializeCalendar();
  }

  private initializeCalendar() {
    this.updateCurrentMonthAndYear();
    this.loadEvents();
    this.createCalendarDays();
  }

  private checkForNewEvents() {
    effect(() => {
      const newEvent = this.modalSvc.getEvent;
      if (newEvent) {
        this.updateEvent(newEvent);
      }
    });
  }

  private loadEvents() {
    this.allEvents = this.modalSvc.getAllEvents();
  }

  formatDate(date: Date | string): string {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date:', date);
      return 'Fecha inválida';
    }
    return parsedDate.toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  private updateEvent(item: Events) {
    this.allEvents = this.allEvents.filter(event => event.id !== item.id).concat(item);
    this.modalSvc.saveEvents();
    this.createCalendarDays();
  }

  private updateCurrentMonthAndYear() {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.currentMonthAndYear = `${monthNames[this.date.getMonth()]} de ${this.date.getFullYear()}`;
  }

  previousMonth() {
    this.date.setMonth(this.date.getMonth() - 1);
    this.initializeCalendar();
  }

  nextMonth() {
    this.date.setMonth(this.date.getMonth() + 1);
    this.initializeCalendar();
  }

  private createCalendarDays() {
    this.calendarDays = [];
    const today = new Date();
    const firstDayOfMonth = new Date(this.date.getFullYear(), this.date.getMonth(), 1).getDay();
    const daysInMonth = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0).getDate();
    const prevDaysMonth = new Date(this.date.getFullYear(), this.date.getMonth(), 0).getDate();

    this.addCalendarDaysFromPreviousMonth(firstDayOfMonth, prevDaysMonth);
    this.addCalendarDaysFromCurrentMonth(today, daysInMonth);
    this.addCalendarDaysFromNextMonth();
  }

  private addCalendarDaysFromPreviousMonth(firstDayOfMonth: number, prevDaysMonth: number) {
    for (let i = firstDayOfMonth; i > 0; i--) {
      const day = prevDaysMonth - i + 1;
      this.addCalendarDay(this.date.getFullYear(), this.date.getMonth() - 1, day, false, false);
    }
  }

  private addCalendarDaysFromCurrentMonth(today: Date, daysInMonth: number) {
    for (let i = 1; i <= daysInMonth; i++) {
      const isCurrentDay = today.toDateString() === new Date(this.date.getFullYear(), this.date.getMonth(), i).toDateString();
      this.addCalendarDay(this.date.getFullYear(), this.date.getMonth(), i, isCurrentDay, true);
    }
  }

  private addCalendarDaysFromNextMonth() {
    const remainingDays = this.totalDays - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      this.addCalendarDay(this.date.getFullYear(), this.date.getMonth() + 1, i, false, false);
    }
  }
  private addCalendarDay(year: number, month: number, day: number, isCurrentDay: boolean, isCurrentMonth: boolean) {
    const date = new Date(year, month, day);
    this.calendarDays.push({
      day,
      currentDay: isCurrentDay,
      currentMonth: isCurrentMonth,
      events: this.getEventsForDate(date),
      date,
    });
  }

  private getEventsForDate(date: Date): Events[] {
    return this.allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  openModal() {
    this.modalSvc.openModal();
  }

  editModal(event: Events) {
    this.modalSvc.openModal(event);
  }

  removeEvent(calendarIndex: number, eventIndex: number): void {
    const dialogRef = this.dialog.open(DeleteComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const eventToRemove = this.calendarDays[calendarIndex].events[eventIndex];
        this.allEvents = this.allEvents.filter(event => event.id !== eventToRemove.id);
        this.modalSvc.deleteEvent(eventToRemove.id);
        this.createCalendarDays();
      }
    });
  }

  createEvent(item: Events) {
    const existingEventIndex = this.allEvents.findIndex(event => event.id === item.id);
    if (existingEventIndex > -1) {
      this.allEvents[existingEventIndex] = item;
    } else {
      this.allEvents.push(item);
    }
    this.modalSvc.setEvent(item);
    this.createCalendarDays();
  }
}
