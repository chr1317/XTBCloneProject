import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  login() {
  this.auth.login(this.email, this.password).subscribe({
    next: (res) => {
      console.log('LOGIN OK:', res);

      this.router.navigate(['/dashboard']);
    },

    error: (err) => {
      console.log('LOGIN ERROR:', err);

      alert(
        err?.error?.message ||
        err?.error ||
        'Błędne dane'
      );
    }
  });
}
}