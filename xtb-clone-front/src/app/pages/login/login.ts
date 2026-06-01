import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email = '';
  password = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  login(): void {
    if (this.loading) {
      return;
    }

    if (!this.email || !this.password) {
      this.toastr.warning('Wpisz email i hasło.', 'Brak danych');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.auth
      .login(this.email, this.password)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.toastr.success('Zalogowano pomyślnie.', 'Sukces');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.log('LOGIN ERROR:', err);

          this.toastr.error('Nieprawidłowy email lub hasło.', 'Błąd logowania');

          this.cdr.detectChanges();
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
