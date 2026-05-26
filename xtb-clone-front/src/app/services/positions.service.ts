import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Position {
  id: number;
  instrument: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
}

@Injectable({ providedIn: 'root' })
export class PositionsService {

  private positionsSubject = new BehaviorSubject<Position[]>([]);
  positions$ = this.positionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadPositions(): void {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<Position[]>('http://localhost:8080/api/positions', { headers })
      .subscribe({
        next: (data) => {
          this.positionsSubject.next(data);
        },
        error: (err) => {
          console.error('POSITIONS ERROR:', err);
        }
      });
  }
}