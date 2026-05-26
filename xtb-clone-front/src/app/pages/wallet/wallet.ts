import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';

import { WalletService, Wallet } from '../../services/wallet.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css']
})
export class WalletComponent implements OnInit {

  wallet: Wallet | null = null;

  depositAmount = 0;

  loading = false;

  successMessage = '';
  errorMessage = '';

  constructor(private walletService: WalletService, private cdr: ChangeDetectorRef) {
    console.log('[Wallet] constructor');
  }

  ngOnInit(): void {
    console.log('[Wallet] ngOnInit START');
    this.loadWallet();
  }

  loadWallet(): void {

    console.log('[Wallet] loadWallet() -> REQUEST GET /wallet');

    this.walletService.getWallet().subscribe({
      next: (data) => {

        console.log('[Wallet] GET wallet SUCCESS:', data);

        this.wallet = data;
        this.cdr.detectChanges();

        console.log('[Wallet] wallet assigned:', this.wallet);
      },

      error: (err) => {

        console.error('[Wallet] GET wallet ERROR:', err);

        this.errorMessage = 'Nie udało się pobrać portfela';
      },

      complete: () => {
        console.log('[Wallet] GET wallet COMPLETE');
      }
    });
  }

  deposit(): void {

    console.log('[Wallet] deposit CLICK', this.depositAmount);

    if (this.depositAmount <= 0) {
      console.warn('[Wallet] invalid amount');
      this.errorMessage = 'Podaj poprawną kwotę';
      return;
    }

    this.loading = true;

    this.successMessage = '';
    this.errorMessage = '';

    console.log('[Wallet] deposit REQUEST POST /deposit');

    this.walletService.deposit(this.depositAmount)
      .pipe(
        finalize(() => {
          console.log('[Wallet] deposit finalize -> loading=false');
          this.loading = false;
        })
      )
      .subscribe({

        next: (res) => {
          console.log('[Wallet] deposit SUCCESS:', res);

          this.successMessage = '✔ Wpłata zakończona sukcesem';

          this.depositAmount = 0;

          console.log('[Wallet] refreshing wallet after deposit...');
          this.loadWallet();
        },

        error: (err) => {
          console.error('[Wallet] deposit ERROR:', err);

          this.errorMessage =
            err?.error?.message || '❌ Błąd wpłaty';
        },

        complete: () => {
          console.log('[Wallet] deposit COMPLETE');
        }
      });
  }
}