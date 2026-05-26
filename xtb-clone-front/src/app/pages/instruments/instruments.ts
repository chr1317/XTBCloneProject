import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  PricesSignalRService,
  Instrument
} from '../../services/prices-signalr.service';

import {
  ChartConfiguration
} from 'chart.js';

import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-instruments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './instruments.html',
  styleUrls: ['./instruments.css']
})
export class InstrumentsComponent implements OnInit, OnDestroy {

  instruments: Instrument[] = [];
  selected: Instrument | null = null;

  // 🔥 stabilny bufor (bez mutation chaosu)
  private priceHistory: number[] = [];
  private labelHistory: string[] = [];

  private updateScheduled = false;

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Cena',

        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.15)',

        fill: true,
        tension: 0.35,

        pointRadius: 0,
        borderWidth: 2
      }
    ]
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,

    animation: {
      duration: 150 // 🔥 wygładza skoki
    },

    plugins: {
      legend: { display: false }
    },

    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    },

    elements: {
      point: { radius: 0 }
    }
  };

  constructor(
    private pricesService: PricesSignalRService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.pricesService.connect();

    this.pricesService.prices$.subscribe(data => {

      this.instruments = data.map(i => ({ ...i }));

      if (!this.selected && this.instruments.length) {
        this.select(this.instruments[0]);
      }

      if (this.selected) {
        const updated = this.instruments.find(x => x.id === this.selected!.id);
        if (updated) {
          this.selected = updated;
          this.pushPrice(updated.currentPrice);
        }
      }

      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.pricesService.disconnect();
  }

  select(i: Instrument): void {

    this.selected = i;

    this.priceHistory = [];
    this.labelHistory = [];

    this.syncChart();
    this.pushPrice(i.currentPrice);
  }

  // 🔥 THROTTLED UPDATE (klucz do stabilności)
  private pushPrice(price: number): void {

    const now = new Date().toLocaleTimeString();

    this.priceHistory.push(price);
    this.labelHistory.push(now);

    if (this.priceHistory.length > 40) {
      this.priceHistory.shift();
      this.labelHistory.shift();
    }

    if (!this.updateScheduled) {
      this.updateScheduled = true;

      requestAnimationFrame(() => {
        this.syncChart();
        this.updateScheduled = false;
      });
    }
  }

  // 🔥 IMMUTABLE update (Chart.js lubi to bardziej)
  private syncChart(): void {

    this.chartData = {
      labels: [...this.labelHistory],
      datasets: [
        {
          ...this.chartData.datasets[0],
          data: [...this.priceHistory]
        }
      ]
    };

    this.cdr.markForCheck();
  }

  buy(): void {
    alert(`Kupiono ${this.selected?.symbol}`);
  }

  sell(): void {
    alert(`Sprzedano ${this.selected?.symbol}`);
  }

  trackById(index: number, item: Instrument): number {
    return item.id;
  }
}