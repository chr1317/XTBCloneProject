import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  avatarPath?: string | null;
}

interface AvatarResponse {
  avatarPath: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {
  private apiUrl = 'http://localhost:8080/api';
  private backendUrl = 'http://localhost:8080';

  profile: UserProfile | null = null;

  username = '';
  email = '';

  selectedFile: File | null = null;
  avatarPreviewUrl = '';

  loading = false;
  saving = false;
  uploading = false;

  message = '';
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.message = '';
    this.error = '';

    this.http
      .get<UserProfile>(`${this.apiUrl}/users/me`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.profile = data;
          this.username = data.username;
          this.email = data.email;
          this.setAvatarFromPath(data.avatarPath);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Nie udało się pobrać profilu.';
          this.profile = null;
        },
      });
  }

  saveProfile(): void {
    this.saving = true;
    this.message = '';
    this.error = '';

    this.http
      .put(
        `${this.apiUrl}/users/me`,
        {
          username: this.username,
          email: this.email,
        },
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.message = 'Profil został zaktualizowany.';

          if (this.profile) {
            this.profile = {
              ...this.profile,
              username: this.username,
              email: this.email,
            };
          }
        },
        error: (err) => {
          console.error(err);
          this.error = 'Nie udało się zapisać profilu.';
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  uploadAvatar(): void {
    if (!this.selectedFile) {
      this.error = 'Wybierz plik avatara.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.uploading = true;
    this.message = '';
    this.error = '';

    this.http
      .post<AvatarResponse>(`${this.apiUrl}/files/avatar`, formData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: (response) => {
          this.message = 'Avatar został przesłany.';
          this.selectedFile = null;

          if (this.profile) {
            this.profile = {
              ...this.profile,
              avatarPath: response.avatarPath,
            };
          }

          this.setAvatarFromPath(response.avatarPath);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Nie udało się przesłać avatara.';
        },
      });
  }

  private setAvatarFromPath(path?: string | null): void {
    if (!path) {
      this.avatarPreviewUrl = '';
      return;
    }

    this.avatarPreviewUrl = `${this.backendUrl}${path}?v=${Date.now()}`;
  }

  onAvatarError(): void {
    this.avatarPreviewUrl = '';
  }

  get initials(): string {
    const name = this.profile?.username || this.username || 'User';

    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}