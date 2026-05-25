import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  username = '';
  email = '';
  password = '';
  message = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
  this.message = '';
  this.error = '';

  this.auth.register(this.username, this.email, this.password)
    .subscribe({
      next: (res) => {
        this.message = 'Konto utworzone ✔';
        console.log('REGISTER OK:', res);

        setTimeout(() => this.router.navigate(['/']), 1000);
      },
      error: (err) => {
        console.log('REGISTER ERROR:', err);

        this.error =
          err?.error?.message ||
          err?.error ||
          'Coś poszło nie tak';
      }
    });
}
}