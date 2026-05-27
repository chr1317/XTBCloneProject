import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs/operators';

import {
  WalletService,
  Wallet,
  Balance
} from '../../services/wallet.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css']
})
export class WalletComponent implements OnInit {

  wallet: Wallet | null = null;

  loading = false;

  successMessage = '';
  errorMessage = '';

  depositAmount = 0;
  depositCurrency = 'PLN';

  withdrawAmount = 0;
  withdrawCurrency = 'PLN';

  convertAmount = 0;
  fromCurrency = 'USD';
  toCurrency = 'PLN';

  currencies = ['PLN', 'USD', 'EUR'];

  constructor(
    private walletService: WalletService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet(): void {

    this.walletService.getWallet().subscribe({

      next: (data) => {

        console.log('WALLET:', data);

        this.wallet = data;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);

        this.errorMessage =
          'Nie udało się pobrać portfela';
      }
    });
  }

  getBalance(currency: string): number {

    const balance = this.wallet?.balances.find(
      b => b.currency === currency
    );

    return balance?.amount || 0;
  }

  deposit(): void {

    if (this.depositAmount <= 0) {
      this.errorMessage = 'Podaj poprawną kwotę';
      return;
    }

    this.loading = true;

    this.successMessage = '';
    this.errorMessage = '';

    this.walletService.deposit(
      this.depositCurrency,
      this.depositAmount
    )
    .pipe(
      finalize(() => {
        this.loading = false;
      })
    )
    .subscribe({

      next: () => {

        this.successMessage =
          '✔ Wpłata zakończona sukcesem';

        this.depositAmount = 0;

        this.loadWallet();
      },

      error: (err) => {

        console.error(err);

        this.errorMessage =
          err?.error?.message || '❌ Błąd wpłaty';
      }
    });
  }

  withdraw(): void {

    if (this.withdrawAmount <= 0) {
      this.errorMessage = 'Podaj poprawną kwotę';
      return;
    }

    this.loading = true;

    this.successMessage = '';
    this.errorMessage = '';

    this.walletService.withdraw(
      this.withdrawCurrency,
      this.withdrawAmount
    )
    .pipe(
      finalize(() => {
        this.loading = false;
      })
    )
    .subscribe({

      next: () => {

        this.successMessage =
          '✔ Wypłata zakończona sukcesem';

        this.withdrawAmount = 0;

        this.loadWallet();
      },

      error: (err) => {

        console.error(err);

        this.errorMessage =
          err?.error?.message || '❌ Błąd wypłaty';
      }
    });
  }

  convert(): void {

    if (this.convertAmount <= 0) {
      this.errorMessage = 'Podaj poprawną kwotę';
      return;
    }

    this.loading = true;

    this.successMessage = '';
    this.errorMessage = '';

    this.walletService.convert(
      this.fromCurrency,
      this.toCurrency,
      this.convertAmount
    )
    .pipe(
      finalize(() => {
        this.loading = false;
      })
    )
    .subscribe({

      next: () => {

        this.successMessage =
          '✔ Przewalutowanie zakończone';

        this.convertAmount = 0;

        this.loadWallet();
      },

      error: (err) => {

        console.error(err);

        this.errorMessage =
          err?.error?.message || '❌ Błąd przewalutowania';
      }
    });
  }
}