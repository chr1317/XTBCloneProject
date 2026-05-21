import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {
  constructor(private auth: AuthService) {}

  get userRole(): string {
    return this.auth.isAdmin() ? 'Admin' : 'User';
  }

  get actionTileLabel(): string {
    return this.auth.isAdmin() ? 'CRUD użytkowników' : 'Mój profil';
  }

  get actionTileRoute(): string {
    return this.auth.isAdmin() ? '/users' : '/profile';
  }
}
