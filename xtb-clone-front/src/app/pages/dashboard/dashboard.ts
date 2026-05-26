import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  user: any;
  wallet: any;

  positions: any[] = [];
  instruments: any[] = [];
  trades: any[] = [];

  pnl = 0;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();

    this.loadMe();
    this.loadPositions();
    this.loadInstruments();
    this.loadTrades();
  }

  loadMe() {
    this.http.get('http://localhost:8080/api/auth/me')
      .subscribe(res => this.wallet = res);
  }

  loadPositions() {
    this.http.get<any[]>('http://localhost:8080/api/positions')
      .subscribe(res => {
        this.positions = res;
        this.calculatePnL();
      });
  }

  loadInstruments() {
    this.http.get<any[]>('http://localhost:8080/api/instruments')
      .subscribe(res => this.instruments = res.slice(0, 6));
  }

  loadTrades() {
    this.http.get<any[]>('http://localhost:8080/api/trades')
      .subscribe(res => this.trades = res.slice(0, 5));
  }

  calculatePnL() {
    this.pnl = this.positions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);
  }
}