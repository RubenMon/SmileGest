import { Component, OnInit, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Calendar } from '../../interfaces/calendar.interface';
import { Events } from '../../interfaces/events.interface';
import { NgClass, NgStyle, NgIf, NgFor, CommonModule } from '@angular/common';
import { ModalEventsService } from '../../services/calendar/modal-events.service';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DeleteComponent } from '../../modals/delete/delete.component';
import { MatDialog } from '@angular/material/dialog';
import { getAuth } from 'firebase/auth';
import { ModalAdminEventsComponent } from '../../modals/modal-admin-events/modal-admin-events.component';
import { ModalUserEventsComponent } from '../../modals/modal-user-events/modal-user-events.component';
import { AuthService } from '../../services/user/auth.service';
import { Router } from '@angular/router';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    MatIconButton,
    MatIcon,
    MatMenuModule,
    NgClass,
    NgStyle,
    NgIf,
    NgFor
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
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

  isAdmin: boolean = false;
  dni?: string;

  ngOnInit(): void {
    this.subscribeToEvents();
    this.initializeCalendar();

    const user = getAuth().currentUser;
    this.isAdmin = user?.email === 'administracionclinica@gmail.com';

    this.authService.getUserLogged().subscribe(userData => {
      if (userData?.dni) {
        this.dni = userData.dni;
      } else {
        console.warn('No se encontró el DNI del usuario.');
      }
    });
  }

  toggleView(mode: 'month' | 'week') {
    this.viewMode = mode;
    this.initializeCalendar();
  }

  showEventModal(ev?: Events, i?: number, j?: number) {
    const user = getAuth().currentUser;
    const isAdmin = user?.email === 'administracionclinica@gmail.com';
    const ModalComp = isAdmin ? ModalAdminEventsComponent : ModalUserEventsComponent;
    this.modalSvc.openModal(ModalComp, ev);
  }

  removeEvent(i: number, j: number) {
    const dialogRef = this.dialog.open(DeleteComponent);
    dialogRef.afterClosed().subscribe(ok => {
      if (!ok) return;
      const ev = (this.viewMode === 'month' ? this.calendarDays : this.weekDays)[i].events[j];
      this.modalSvc.deleteEventFromFirestore(ev.id);
    });
  }

  private subscribeToEvents() {
    this.modalSvc.events$.subscribe(events => {
      this.allEvents = events;
      this.initializeCalendar();
    });
  }

  private initializeCalendar() {
    if (this.viewMode === 'month') {
      this.updateCurrentMonthAndYear();
      this.createCalendarDays();
    } else {
      this.updateCurrentWeekRange();
      this.createWeekDays();
    }
  }

  private updateCurrentMonthAndYear() {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.currentMonthAndYear = `${monthNames[this.date.getMonth()]} de ${this.date.getFullYear()}`;
  }

  private updateCurrentWeekRange() {
    const dt = new Date(this.date);
    const day = dt.getDay() || 7;
    const monday = new Date(dt.setDate(dt.getDate() - (day - 1)));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.currentWeekRange = `${monday.toLocaleDateString('es-ES')} - ${sunday.toLocaleDateString('es-ES')}`;
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
    return this.allEvents.filter(ev => ev.date.toDateString() === date.toDateString());
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

  formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  logout() {
    this.authService.logout()
      .then(() => {
        this.router.navigate(['/login']);
        window.location.reload();
      })
      .catch(error => {
        console.error("Error al cerrar sesión:", error);
      });
  }

  verUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  verPerfil() {
      this.router.navigate(['/usuarios/' + this.dni]);
  }
}
