import { Component, ChangeDetectorRef } from '@angular/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  username = '';
  email = '';
  password = '';

  message = '';
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  register(): void {
    this.message = '';
    this.error = '';

    if (!this.username || !this.email || !this.password) {
      this.toastr.warning('Uzupełnij wszystkie pola.', 'Brak danych');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.auth
      .register(this.username, this.email, this.password)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.toastr.success('Konto zostało utworzone. Możesz się teraz zalogować.', 'Sukces');

          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.log('REGISTER ERROR:', err);

          this.toastr.error('Nie udało się utworzyć konta.', 'Błąd rejestracji');

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
