import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

export interface Instrument {
  id: number;
  symbol: string;
  name: string;
  type: string;
  currentPrice: number;

  priceUp?: boolean;
  priceDown?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PricesSignalRService {

  private hub!: signalR.HubConnection;

  private pricesSubject = new BehaviorSubject<Instrument[]>([]);
  prices$ = this.pricesSubject.asObservable();

  private lastPrices = new Map<number, number>();

  connect(): void {

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:8080/hubs/prices')
      .withAutomaticReconnect()
      .build();

    this.hub.start()
      .then(() => console.log('SignalR connected'))
      .catch(err => console.error('SignalR error', err));

    this.hub.on('ReceivePrices', (data: Instrument[]) => {

      const updated = data.map(inst => {

        const prev = this.lastPrices.get(inst.id);

        const priceUp = prev !== undefined && inst.currentPrice > prev;
        const priceDown = prev !== undefined && inst.currentPrice < prev;

        this.lastPrices.set(inst.id, inst.currentPrice);

        return {
          ...inst,
          priceUp,
          priceDown
        };
      });

      // 🔥 KLUCZ: nowa referencja + nowy array
      this.pricesSubject.next(updated.map(x => ({ ...x })));
    });
  }

  disconnect(): void {
    this.hub?.stop();
  }
}