import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Balance {
  currency: string;
  amount: number;
}

export interface Wallet {
  id: number;
  balances: Balance[];
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  private api = 'http://localhost:8080/api/wallet';

  constructor(private http: HttpClient) {}

  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(this.api);
  }

  deposit(currency: string, amount: number): Observable<any> {
    return this.http.post<any>(`${this.api}/deposit`, {
      currency,
      amount
    });
  }

  convert(
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): Observable<any> {

    return this.http.post<any>(`${this.api}/convert`, {
      fromCurrency,
      toCurrency,
      amount
    });
  }

  withdraw(currency: string, amount: number): Observable<any> {
    return this.http.post<any>(`${this.api}/withdraw`, {
      currency,
      amount
    });
  }
}