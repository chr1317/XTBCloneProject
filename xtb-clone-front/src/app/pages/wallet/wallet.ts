import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { WalletService, Wallet } from '../../services/wallet.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css'],
})
export class WalletComponent implements OnInit {
  wallet: Wallet | null = null;

  loading = false;

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
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet(): void {
    this.walletService.getWallet().subscribe({
      next: (data) => {
        this.wallet = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Nie udało się pobrać portfela.', 'Błąd');
        this.cdr.detectChanges();
      },
    });
  }

  getBalance(currency: string): number {
    const balance = this.wallet?.balances.find((b) => b.currency === currency);
    return balance?.amount || 0;
  }

  deposit(): void {
    if (this.loading) {
      return;
    }

    if (this.depositAmount <= 0) {
      this.toastr.warning('Podaj poprawną kwotę wpłaty.', 'Niepoprawna kwota');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.walletService
      .deposit(this.depositCurrency, this.depositAmount)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            `Wpłacono ${this.depositAmount.toFixed(2)} ${this.depositCurrency}.`,
            'Wpłata zakończona'
          );

          this.depositAmount = 0;
          this.loadWallet();
        },
        error: (err) => {
          console.error(err);

          this.toastr.error(
            this.getErrorMessage(err, 'Nie udało się wykonać wpłaty.'),
            'Błąd wpłaty'
          );
        },
      });
  }

  withdraw(): void {
    if (this.loading) {
      return;
    }

    if (this.withdrawAmount <= 0) {
      this.toastr.warning('Podaj poprawną kwotę wypłaty.', 'Niepoprawna kwota');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.walletService
      .withdraw(this.withdrawCurrency, this.withdrawAmount)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            `Wypłacono ${this.withdrawAmount.toFixed(2)} ${this.withdrawCurrency}.`,
            'Wypłata zakończona'
          );

          this.withdrawAmount = 0;
          this.loadWallet();
        },
        error: (err) => {
          console.error(err);

          this.toastr.error(
            this.getErrorMessage(err, 'Nie udało się wykonać wypłaty.'),
            'Błąd wypłaty'
          );
        },
      });
  }

  convert(): void {
    if (this.loading) {
      return;
    }

    if (this.convertAmount <= 0) {
      this.toastr.warning(
        'Podaj poprawną kwotę przewalutowania.',
        'Niepoprawna kwota'
      );
      return;
    }

    if (this.fromCurrency === this.toCurrency) {
      this.toastr.warning(
        'Wybierz dwie różne waluty.',
        'Niepoprawne przewalutowanie'
      );
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.walletService
      .convert(this.fromCurrency, this.toCurrency, this.convertAmount)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            `Przewalutowano ${this.convertAmount.toFixed(2)} ${this.fromCurrency} na ${this.toCurrency}.`,
            'Przewalutowanie zakończone'
          );

          this.convertAmount = 0;
          this.loadWallet();
        },
        error: (err) => {
          console.error(err);

          this.toastr.error(
            this.getErrorMessage(err, 'Nie udało się wykonać przewalutowania.'),
            'Błąd przewalutowania'
          );
        },
      });
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string') {
      return err.error;
    }

    return err?.error?.message || err?.error?.title || err?.message || fallback;
  }
}