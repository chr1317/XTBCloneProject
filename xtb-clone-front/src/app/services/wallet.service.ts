import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
export type WalletCurrency = 'USD' | 'PLN' | 'EUR';

export interface Balance {
  currency: string;
  amount: number;
}

export interface Wallet {
  id: number;
  balances: Balance[];
}

export interface WalletTotalBalance {
  currency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
}

export interface WalletTotalResponse {
  currency: WalletCurrency;
  totalAmount: number;
  balances: WalletTotalBalance[];
}

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private api = `${environment.apiUrl}/wallet`;

  constructor(private http: HttpClient) {}

  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(this.api);
  }

  getWalletTotal(currency: WalletCurrency): Observable<WalletTotalResponse> {
    return this.http.get<WalletTotalResponse>(`${this.api}/total?currency=${currency}`);
  }

  deposit(currency: string, amount: number): Observable<any> {
    return this.http.post(`${this.api}/deposit`, { currency, amount });
  }

  convert(fromCurrency: string, toCurrency: string, amount: number): Observable<any> {
    return this.http.post(`${this.api}/convert`, {
      fromCurrency,
      toCurrency,
      amount,
    });
  }

  withdraw(currency: string, amount: number): Observable<any> {
    return this.http.post(`${this.api}/withdraw`, { currency, amount });
  }
}
