// src/app/graficos/graficos-tipos.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { ChartData, ChartType } from 'chart.js';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-graficos-tipos',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule, NgChartsModule, MatIconModule],
  templateUrl: './graficos-tipos.component.html',
  styleUrls: ['./graficos-tipos.component.css']
})
export class GraficosTiposComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);

  pieChartData: ChartData = { labels: [], datasets: [{ data: [] }] };
  chartReady = false;

  chartTypes: { value: ChartType, label: string }[] = [
    { value: 'pie', label: 'Gráfico de Tarta' },
    { value: 'doughnut', label: 'Gráfico de Rosquilla' },
    { value: 'polarArea', label: 'Gráfico de Área Polar' }
  ];
  selectedChartType: ChartType = 'pie';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.chartReady = false;

    const eventsRef = collection(this.firestore, 'events');
    const observable$ = collectionData(eventsRef, { idField: 'id' });

    observable$.subscribe({
      next: (events) => this.processEvents(events),
      error: (error) => {
        console.error('Error cargando eventos:', error);
        this.chartReady = false;
      }
    });
  }

  private processEvents(events: any[]) {
    if (!events.length) {
      this.chartReady = false;
      return;
    }

    const counts: Record<string, number> = {};
    events.forEach(event => {
      const type = event.type?.trim() || 'Desconocido';
      counts[type] = (counts[type] || 0) + 1;
    });

    this.pieChartData = {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts) }]
    };

    this.chartReady = true;
  }

  volverAlCalendario() {
    this.router.navigate(['/calendario']);
  }
}
