import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  PositionsService
} from '../../services/positions.service';

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
  styleUrls: ['./positions.css']
})
export class PositionsComponent implements OnInit {

  positions: Position[] = [];
  trades: Trade[] = [];

  closingId: number | null = null;

  constructor(
    private positionsService: PositionsService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.positionsService.loadPositions();
    this.positionsService.loadTrades();

    this.positionsService.positions$.subscribe(data => {

      this.positions = [...data];

      this.cdRef.detectChanges();
    });

    this.positionsService.trades$.subscribe(data => {

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

    const confirmed = confirm(
      `Zamknąć pozycję ${p.instrument.symbol}?`
    );

    if (!confirmed) return;

    this.closingId = p.id;

    this.positionsService.closePosition(p)
      .subscribe({

        next: () => {

          this.positionsService.loadPositions();
          this.positionsService.loadTrades();

          this.closingId = null;
        },

        error: (err) => {

          console.error(err);

          alert(
            err?.error?.message ||
            'Błąd zamykania pozycji'
          );

          this.closingId = null;
        }
      });
  }

  formatDate(date: string): string {

    return new Date(date)
      .toLocaleString('pl-PL');
  }
}