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
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';

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
  private firestore = inject(Firestore);

  nameDay = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  calendarDays: Calendar[] = [];
  weekDays: Calendar[] = [];
  allEvents: Events[] = [];
  currentMonthAndYear?: string;
  currentWeekRange?: string;
  viewMode: 'month' | 'week' = 'month';
  private date = new Date();

  isAdmin: boolean = false;
  userId?: string;

  /**
   * Método del ciclo de vida Angular que se ejecuta al inicializar el componente.
   * Se suscribe a los eventos, inicializa el calendario y obtiene el DNI del usuario actual.
   */
  ngOnInit(): void {
    this.subscribeToEvents();

    this.initializeCalendar();

    const user = getAuth().currentUser;
    this.isAdmin = user?.email === 'administracionclinica@gmail.com';

    if (user?.email) {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      collectionData(q).subscribe(users => {
        if (users.length > 0) {
          const userData = users[0];
          this.userId = userData['dni'] || undefined;
          if (!this.userId) {
            alert('No se encontró DNI en Firestore para este usuario');
          }
        } else {
          alert('Usuario no encontrado en Firestore con email: ' + user.email);
        }
      });
    }
  }

  /**
   * Cambia el modo de vista entre 'month' y 'week' y reinicializa el calendario.
   * @param mode Nuevo modo de vista ('month' o 'week').
   */
  toggleView(mode: 'month' | 'week') {
    this.viewMode = mode;
    this.initializeCalendar();
  }

  /**
   * Abre el modal para crear o editar un evento.
   * Selecciona el componente modal según si el usuario es admin o usuario normal.
   * @param ev Evento a mostrar o editar (opcional).
   * @param i Índice (opcional) para posición en listas (no usado aquí).
   * @param j Índice (opcional) para posición en listas (no usado aquí).
   */
  showEventModal(ev?: Events, i?: number, j?: number) {
    const user = getAuth().currentUser;
    const isAdmin = user?.email === 'administracionclinica@gmail.com';
    const ModalComp = isAdmin ? ModalAdminEventsComponent : ModalUserEventsComponent;
    this.modalSvc.openModal(ModalComp, ev);
  }

  /**
   * Elimina un evento después de pedir confirmación mediante un diálogo.
   * @param i Índice del día en el calendario (mes o semana).
   * @param j Índice del evento dentro del día.
   */
  removeEvent(i: number, j: number) {
    const dialogRef = this.dialog.open(DeleteComponent);
    dialogRef.afterClosed().subscribe(ok => {
      if (!ok) return;
      const ev = (this.viewMode === 'month' ? this.calendarDays : this.weekDays)[i].events[j];
      this.modalSvc.deleteEventFromFirestore(ev.id);
    });
  }

  /**
   * Se suscribe a los eventos emitidos por el servicio ModalEventsService.
   * Actualiza la lista de todos los eventos y reinicializa el calendario cuando cambian.
   */
  private subscribeToEvents() {
    this.modalSvc.events$.subscribe(events => {
      this.allEvents = events;
      this.initializeCalendar();
    });
  }

  /**
   * Inicializa el calendario según el modo de vista actual.
   * Si es 'month' crea el calendario mensual, si es 'week' crea la vista semanal.
   */
  private initializeCalendar() {
    if (this.viewMode === 'month') {
      this.updateCurrentMonthAndYear();
      this.createCalendarDays();
    } else {
      this.updateCurrentWeekRange();
      this.createWeekDays();
    }
  }

  /**
   * Actualiza la variable currentMonthAndYear con el nombre del mes y el año actual.
   */
  private updateCurrentMonthAndYear() {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.currentMonthAndYear = `${monthNames[this.date.getMonth()]} de ${this.date.getFullYear()}`;
  }

  /**
   * Actualiza la variable currentWeekRange con el rango de fechas de la semana actual (lunes a domingo).
   */
  private updateCurrentWeekRange() {
    const dt = new Date(this.date);
    const day = dt.getDay() || 7; // domingo como 7 en lugar de 0
    const monday = new Date(dt.setDate(dt.getDate() - (day - 1)));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.currentWeekRange = `${monday.toLocaleDateString('es-ES')} - ${sunday.toLocaleDateString('es-ES')}`;
  }

  /**
   * Crea el arreglo de días para mostrar en el calendario mensual,
   * agregando espacios en blanco al inicio para alinear correctamente los días.
   */
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

  /**
   * Crea el arreglo de días para mostrar en la vista semanal,
   * comenzando desde el lunes de la semana actual.
   */
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

  /**
   * Obtiene los eventos que corresponden a una fecha concreta.
   * @param date Fecha para filtrar eventos.
   * @returns Array de eventos que ocurren ese día.
   */
  private getEventsForDate(date: Date) {
    return this.allEvents.filter(ev => ev.date.toDateString() === date.toDateString());
  }

  /**
   * Mueve la fecha actual al mes o semana anterior, según el modo de vista,
   * y actualiza el calendario.
   */
  previous() {
    if (this.viewMode === 'month') {
      this.date.setMonth(this.date.getMonth() - 1);
    } else {
      this.date.setDate(this.date.getDate() - 7);
    }
    this.initializeCalendar();
  }

  /**
   * Mueve la fecha actual al mes o semana siguiente, según el modo de vista,
   * y actualiza el calendario.
   */
  next() {
    if (this.viewMode === 'month') {
      this.date.setMonth(this.date.getMonth() + 1);
    } else {
      this.date.setDate(this.date.getDate() + 7);
    }
    this.initializeCalendar();
  }

  /**
   * Formatea una fecha para mostrarla con formato largo en español.
   * @param date Fecha (Date o string) a formatear.
   * @returns Fecha formateada en formato 'lunes, 1 de enero de 2025'.
   */
  formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /**
   * Cierra la sesión del usuario actual, redirige al login y recarga la página.
   */
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

  /**
   * Navega a la página de listado de usuarios (funcionalidad admin).
   */
  verUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  /**
   * Navega al perfil del usuario actual usando su DNI, si está cargado.
   * Muestra alerta si aún no se ha cargado el DNI.
   */
  verPerfil() {
    if (this.userId) {
      console.log(`Navegando al perfil del usuario con DNI: ${this.userId}`);
      this.router.navigate(['/usuarios', this.userId]);
    } else {
      alert('Aún no se ha cargado el DNI del usuario. Intenta nuevamente.');
    }
  }

  /**
   * Navega a la página con gráficos de tipos de eventos.
   */
  verGraficos() {
    this.router.navigate(['/graficos-tipos']);
  }
}
