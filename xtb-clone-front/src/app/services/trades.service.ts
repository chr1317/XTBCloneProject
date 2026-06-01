import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TradeRequest {
  instrumentId: number;
  type: 'BUY' | 'SELL';
  quantity: number;
  allowAutoConversion: boolean;
  acceptedConversionCurrency?: string | null;
}

export interface ConversionPlanItem {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
}

export interface AutoConversionRequiredResponse {
  code: 'AUTO_CONVERSION_REQUIRED';
  message: string;
  availableUsd: number;
  missingUsd: number;
  conversionPlan: ConversionPlanItem[];
  trade: {
    id: number;
    symbol: string;
    name: string;
    quantity: number;
    price: number;
    totalValue: number;
  };
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