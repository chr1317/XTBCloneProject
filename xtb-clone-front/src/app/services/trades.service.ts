import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TradeRequest {
  instrumentId: number;
  type: 'BUY';
  quantity: number;
  allowAutoConversion: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TradesService {

  private api = 'http://localhost:8080/api/trades';

  constructor(private http: HttpClient) {}

  createTrade(req: TradeRequest): Observable<any> {
    return this.http.post(this.api, req);
  }
}