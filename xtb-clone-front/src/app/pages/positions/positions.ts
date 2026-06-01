import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { PositionsService } from '../../services/positions.service';

export interface Position {
  id: number;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  instrument: {
    id: number;
    symbol: string;
    name: string;
    type: string;
  };
}

export interface Trade {
  id: number;
  type: string;
  quantity: number;
  price: number;
  totalValue: number;
  currency: string;
  createdAt: string;
  instrument: {
    id: number;
    symbol: string;
    name: string;
    type: string;
  };
}

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './positions.html',
  styleUrls: ['./positions.css'],
})
export class PositionsComponent implements OnInit {
  positions: Position[] = [];
  trades: Trade[] = [];
  closingId: number | null = null;

  constructor(
    private positionsService: PositionsService,
    private cdRef: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.positionsService.loadPositions();
    this.positionsService.loadTrades();

    this.positionsService.positions$.subscribe((data) => {
      this.positions = [...data];
      this.cdRef.detectChanges();
    });

    this.positionsService.trades$.subscribe((data) => {
      this.trades = [...data];
      this.cdRef.detectChanges();
    });
  }

  getSymbol(p: Position): string {
    return p.instrument?.symbol ?? '-';
  }

  getName(p: Position): string {
    return p.instrument?.name ?? '-';
  }

  closePosition(p: Position): void {
    if (this.closingId !== null) {
      return;
    }

    const confirmed = confirm(`Zamknąć pozycję ${p.instrument.symbol}?`);

    if (!confirmed) {
      return;
    }

    this.closingId = p.id;
    this.cdRef.detectChanges();

    this.positionsService
      .closePosition(p)
      .pipe(
        finalize(() => {
          this.closingId = null;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            `Pozycja ${p.instrument.symbol} została zamknięta.`,
            'Pozycja zamknięta'
          );

          this.positionsService.loadPositions();
          this.positionsService.loadTrades();
        },
        error: (err) => {
          console.error(err);

          this.toastr.error(
            this.getErrorMessage(err, 'Nie udało się zamknąć pozycji.'),
            'Błąd zamykania pozycji'
          );
        },
      });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('pl-PL');
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string') {
      return err.error;
    }

    return err?.error?.message || err?.error?.title || err?.message || fallback;
  }
}