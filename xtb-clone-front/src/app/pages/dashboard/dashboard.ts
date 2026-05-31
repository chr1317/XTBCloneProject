import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, OnDestroy {

  user: any;
  previousPrices: Record<string, number> = {};

  wallet: any = null;
  walletBalanceUsd = 0;

  positions: any[] = [];
  instruments: any[] = [];
  trades: any[] = [];

  pnl = 0;

  private refreshSub?: Subscription;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();

    this.loadAll();

    this.refreshSub = interval(2000).subscribe(() => {
      this.loadAll();
    });
  }

  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
  }

  loadAll() {
    this.loadMe();
    this.loadPositions();
    this.loadInstruments();
    this.loadTrades();
  }

  loadMe() {
  this.http.get<any>('http://localhost:8080/api/wallet')
    .subscribe(res => {

      this.wallet = res;

      this.walletBalanceUsd = 0;

      res.balances.forEach((b: any) => {

        switch (b.currency) {

          case 'USD':
            this.walletBalanceUsd += Number(b.amount);
            break;

          case 'PLN':
            this.walletBalanceUsd += Number(b.amount) * 0.27;
            break;

          case 'EUR':
            this.walletBalanceUsd += Number(b.amount) * 1.13;
            break;
        }
      });

      this.cdRef.detectChanges();
    });
}

  loadPositions() {
    this.http.get<any[]>('http://localhost:8080/api/positions')
      .subscribe(res => {

        this.positions = (res || []).map(p => ({
          ...p,
          pnl: p.profitLoss ?? 0
        }));

        this.calculatePnL();

        this.cdRef.detectChanges(); // 🔥 FORCE UI UPDATE
      });
  }

  loadInstruments() {

      this.http.get<any[]>('http://localhost:8080/api/instruments')
        .subscribe(res => {

          const allowed = ['AAPL', 'TSLA', 'NVDA'];

          this.instruments = (res || [])
            .filter(i => allowed.includes(i.symbol))
            .map(i => {

              const previousPrice =
                this.previousPrices[i.symbol] ?? i.currentPrice;

              const trend =
                i.currentPrice > previousPrice
                  ? 'up'
                  : i.currentPrice < previousPrice
                  ? 'down'
                  : 'same';

              this.previousPrices[i.symbol] = i.currentPrice;

              return {
                ...i,
                price: i.currentPrice ?? 0,
                trend
              };
            })
            .slice(0, 3);

          this.cdRef.detectChanges();
        });
    }

  loadTrades() {
    this.http.get<any[]>('http://localhost:8080/api/trades')
      .subscribe(res => {
        this.trades = res || [];

        this.cdRef.detectChanges();
      });
  }

  calculatePnL() {
    this.pnl = (this.positions || [])
      .reduce((sum, p) => sum + (p.pnl ?? 0), 0);
  }
}