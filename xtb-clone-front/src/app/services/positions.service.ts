import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval } from 'rxjs';
import { Position } from '../models/position.model';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class PositionsService {

  private api = `${environment.apiUrl}/positions`;
  private tradesApi = `${environment.apiUrl}/trades`;

  private positionsSubject =
    new BehaviorSubject<Position[]>([]);

  positions$ =
    this.positionsSubject.asObservable();

  private tradesSubject =
    new BehaviorSubject<any[]>([]);

  trades$ =
    this.tradesSubject.asObservable();

  constructor(private http: HttpClient) {

    interval(2000).subscribe(() => {

      this.loadPositions();
      this.loadTrades();
    });
  }

  loadPositions(): void {

    this.http.get<Position[]>(this.api)
      .subscribe({

        next: (data) => {

          this.positionsSubject.next(data);
        },

        error: (err) => {

          console.error(err);
        }
      });
  }

  loadTrades(): void {

    this.http.get<any[]>(this.tradesApi)
      .subscribe({

        next: (data) => {

          this.tradesSubject.next(data);
        },

        error: (err) => {

          console.error(err);
        }
      });
  }

  closePosition(position: Position) {

    return this.http.post(this.tradesApi, {

      instrumentId: position.instrument.id,

      type: 'SELL',

      quantity: position.quantity,

      allowAutoConversion: true
    });
  }
}