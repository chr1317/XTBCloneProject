import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Wallet {
  id: number;
  walletBalance: number;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  private api = 'http://localhost:8080/api/wallet';

  constructor(private http: HttpClient) {}

  getWallet(): Observable<Wallet> {
    return this.http.get<any>(this.api).pipe(
      map(data => ({
        id: data.id,
        walletBalance: data.cashBalance // 🔥 MAPOWANIE BACKEND -> FRONTEND
      }))
    );
  }

  deposit(amount: number): Observable<any> {
    return this.http.post<any>(`${this.api}/deposit`, { amount });
  }
}