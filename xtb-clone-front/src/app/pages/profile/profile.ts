import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile {
  profileName = '';
  profileEmail = '';
  role = 'User';

  constructor(private auth: AuthService) {
    const email = this.auth.getUserEmail();
    this.profileEmail = email ?? '';
    this.profileName = this.formatName(this.profileEmail);
    this.role = this.auth.isAdmin() ? 'Admin' : 'User';
  }

  saveProfile() {
    localStorage.setItem('userEmail', this.profileEmail);
    this.profileName = this.formatName(this.profileEmail);
    alert('Profil został zaktualizowany');
  }

  private formatName(email: string): string {
    const user = email.split('@')[0] || 'Guest';
    return user
      .split(/\.|_|-/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
