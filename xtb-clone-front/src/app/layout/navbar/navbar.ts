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
  userName = 'Guest';

  constructor(private auth: AuthService) {
    this.updateUser();
  }

  get isLoggedIn(): boolean {
    return this.auth.isLogged();
  }

  get roleLabel(): string {
    return this.auth.isAdmin() ? 'Admin' : 'User';
  }

  get initials(): string {
    return this.userName
      .split(' ')
      .map((part) => part[0] ?? '')
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

  private updateUser(): void {
    const email = this.auth.getUserEmail();
    this.userName = email ? this.formatName(email) : 'Guest';
  }

  private formatName(email: string): string {
    const namePart = email.split('@')[0];
    return namePart
      .split(/\.|_|-/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
