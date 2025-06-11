import { Component, inject, OnInit } from '@angular/core';
import { ChartData, ChartType } from 'chart.js';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-graficos-tipos',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule, NgChartsModule, MatIconModule, MatButtonModule],
  templateUrl: './graficos-tipos.component.html',
  styleUrls: ['./graficos-tipos.component.css']
})
export class GraficosTiposComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);

  /** Datos que se mostrarán en el gráfico (etiquetas y valores). */
  pieChartData: ChartData = { labels: [], datasets: [{ data: [] }] };

  /** Controla si el gráfico está listo para mostrarse. */
  chartReady = false;

  /** Tipos de gráficos disponibles para el usuario. */
  chartTypes: { value: ChartType, label: string }[] = [
    { value: 'pie', label: 'Gráfico de Tarta' },
    { value: 'doughnut', label: 'Gráfico de Rosquilla' },
    { value: 'polarArea', label: 'Gráfico de Área Polar' }
  ];

  /** Tipo de gráfico seleccionado por defecto. */
  selectedChartType: ChartType = 'pie';

  /** Inyección del servicio Firestore para acceder a la base de datos. */
  constructor(private firestore: Firestore) {}

  /**
   * Método del ciclo de vida Angular que se ejecuta al inicializar el componente.
   * Carga los datos para construir el gráfico.
   */
  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Carga los eventos desde Firestore y procesa los datos para el gráfico.
   * También maneja el estado de carga y errores.
   */
  loadData() {
    this.chartReady = false;

    // Referencia a la colección 'events' en Firestore
    const eventsRef = collection(this.firestore, 'events');

    // Observable para obtener datos en tiempo real con ID incluido
    const observable$ = collectionData(eventsRef, { idField: 'id' });

    // Suscripción al observable para procesar los eventos o capturar errores
    observable$.subscribe({
      next: (events) => this.processEvents(events),
      error: (error) => {
        console.error('Error cargando eventos:', error);
        this.chartReady = false;
      }
    });
  }

  /**
   * Procesa la lista de eventos recibidos, cuenta la cantidad por tipo
   * y actualiza los datos del gráfico.
   * @param events Array con los eventos obtenidos de Firestore
   */
  private processEvents(events: any[]) {
    if (!events.length) {
      this.chartReady = false;
      return;
    }

    // Contador para almacenar cantidad de eventos por tipo
    const counts: Record<string, number> = {};

    // Recorre todos los eventos y cuenta según su tipo
    events.forEach(event => {
      const type = event.type?.trim() || 'Desconocido';
      counts[type] = (counts[type] || 0) + 1;
    });

    // Actualiza los datos que alimentan el gráfico
    this.pieChartData = {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts) }]
    };

    // Marca que el gráfico ya está listo para mostrarse
    this.chartReady = true;
  }

  /**
   * Navega de vuelta a la vista del calendario.
   */
  volverAlCalendario() {
    this.router.navigate(['/calendario']);
  }
}
