import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {

  constructor(private auth: AuthService) {}

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get userName(): string {
    return this.auth.getUserName();
  }

  get roleLabel(): string {
    return this.auth.getUserRole();
  }

  get initials(): string {
    return this.userName
      .split(' ')
      .map(p => p[0] ?? '')
      .join('')
      .toUpperCase();
  }

  get primaryLink(): string {
    return this.auth.isAdmin() ? '/users' : '/profile';
  }

  get primaryLabel(): string {
    return this.auth.isAdmin() ? 'Users CRUD' : 'Mój profil';
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }
}