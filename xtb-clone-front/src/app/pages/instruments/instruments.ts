import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricesSignalRService, Instrument } from '../../services/prices-signalr.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-instruments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instruments.html',
  styleUrls: ['./instruments.css']
})
export class InstrumentsComponent implements OnInit, OnDestroy {

  instruments: Instrument[] = [];
  selected: Instrument | null = null;

  constructor(private pricesService: PricesSignalRService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {

    this.pricesService.connect();

    this.pricesService.prices$.subscribe(data => {

      // 🔥 total rebuild list (Angular MUST rerender)
      this.instruments = data.map(i => ({ ...i }));
      this.cdr.detectChanges();

      // selected sync
      if (!this.selected && this.instruments.length) {
        this.selected = this.instruments[0];
      } else if (this.selected) {
        this.selected =
          this.instruments.find(x => x.id === this.selected!.id)
          ?? this.instruments[0];
      }
    });
  }

  ngOnDestroy(): void {
    this.pricesService.disconnect();
  }

  select(i: Instrument): void {
    this.selected = i;
  }

  buy(): void {
    alert(`Kupiono ${this.selected?.symbol}`);
  }

  sell(): void {
    alert(`Sprzedano ${this.selected?.symbol}`);
  }

  trackById(index: number, item: Instrument): number {
    return item.id;
  }
}