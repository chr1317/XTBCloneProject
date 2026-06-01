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

import { HttpErrorResponse } from '@angular/common/http';
import {
  TradesService,
  TradeRequest,
  AutoConversionRequiredResponse
} from '../../services/trades.service';

import {
  ChartConfiguration
} from 'chart.js';

import { BaseChartDirective } from 'ng2-charts';


import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-instruments',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './instruments.html',
  styleUrls: ['./instruments.css']
})
export class InstrumentsComponent implements OnInit, OnDestroy {

  instruments: Instrument[] = [];
  selected: Instrument | null = null;

  quantity: number = 1;

  priceHistory: number[] = [];
  labelHistory: string[] = [];
  conversionModalVisible = false;
  conversionResponse: AutoConversionRequiredResponse | null = null;
  pendingTradeRequest: TradeRequest | null = null;
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
    animation: { duration: 150 },
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    },
    elements: { point: { radius: 0 } }
  };

  constructor(
    private pricesService: PricesSignalRService,
    private tradesService: TradesService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
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

private handleAutoConversionRequired(
  response: AutoConversionRequiredResponse,
  originalRequest: TradeRequest
): void {
  setTimeout(() => {
    this.conversionResponse = response;
    this.pendingTradeRequest = originalRequest;
    this.conversionModalVisible = true;
    this.cdr.detectChanges();
  });
}
confirmAutoConversion(): void {
  if (!this.pendingTradeRequest) {
    this.toastr.error('Brak danych transakcji do potwierdzenia.', 'Błąd');
    this.closeConversionModal();
    return;
  }

  const confirmedRequest: TradeRequest = {
    ...this.pendingTradeRequest,
    allowAutoConversion: true
  };

  this.tradesService.createTrade(confirmedRequest).subscribe({
    next: (res) => {
      this.toastr.success(
        `Kupiono ${confirmedRequest.quantity} x ${this.selected?.symbol} z automatycznym przewalutowaniem.`,
        'Kupno zakończone'
      );

      this.closeConversionModal();
      console.log('TRADE OK WITH CONVERSION:', res);
    },

    error: (err: HttpErrorResponse) => {
      this.toastr.error(
        this.getErrorMessage(err),
        'Błąd przewalutowania'
      );

      console.error(err);
    }
  });
}
closeConversionModal(): void {
  this.conversionModalVisible = false;

  setTimeout(() => {
    this.conversionResponse = null;
    this.pendingTradeRequest = null;
    this.cdr.detectChanges();
  });
}
get totalConversionToUsd(): number {
  return this.conversionResponse?.conversionPlan
    .reduce((sum, item) => sum + item.toAmount, 0) ?? 0;
}

private getErrorMessage(err: HttpErrorResponse): string {
  if (typeof err.error === 'string') {
    return err.error;
  }

  return (
    err.error?.message ||
    err.error?.title ||
    err.message ||
    'Nie udało się wykonać transakcji.'
  );
}

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

trackById(index: number, instrument: Instrument): number {
  return instrument.id;
}

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
  if (!this.selected) {
    this.toastr.warning('Najpierw wybierz instrument.', 'Brak instrumentu');
    return;
  }

  const quantity = Number(this.quantity);

  if (!quantity || quantity <= 0) {
    this.toastr.warning('Podaj ilość większą od zera.', 'Niepoprawna ilość');
    return;
  }

  const req: TradeRequest = {
    instrumentId: this.selected.id,
    type: 'BUY',
    quantity,
    allowAutoConversion: false
  };

  this.tradesService.createTrade(req).subscribe({
    next: (res) => {
      this.toastr.success(
        `Kupiono ${quantity} x ${this.selected?.symbol}.`,
        'Kupno zakończone'
      );

      console.log('TRADE OK:', res);
    },

    error: (err: HttpErrorResponse) => {
  console.log('STATUS:', err.status);
  console.log('ERROR BODY:', err.error);

  if (err.status === 409 && err.error?.code === 'AUTO_CONVERSION_REQUIRED') {
    this.handleAutoConversionRequired(err.error as AutoConversionRequiredResponse, req);
    return;
  }

  this.toastr.error(
    this.getErrorMessage(err),
    'Błąd transakcji'
  );

  console.error(err);
}
  });
}
}