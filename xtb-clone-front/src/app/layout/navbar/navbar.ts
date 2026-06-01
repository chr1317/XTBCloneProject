import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  private backendUrl = environment.backendUrl;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get userName(): string {
    return this.auth.getUserName();
  }

  get roleLabel(): string {
    return this.auth.getUserRole();
  }

  get avatarUrl(): string {
    const avatarPath = this.auth.getUserAvatarPath();

    if (!avatarPath) {
      return '';
    }

    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }

    const normalizedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;

    return `${this.backendUrl}${normalizedPath}`;
  }

  get initials(): string {
    return this.userName
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  get primaryLink(): string {
    return this.auth.isAdmin() ? '/users' : '/profile';
  }

  get primaryLabel(): string {
    return this.auth.isAdmin() ? 'Users CRUD' : 'Mój profil';
  }

  logout(): void {
    this.auth.logout();
    this.cdr.detectChanges();
    this.router.navigate(['/login']);
  }
}
