import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { AuthService } from '../../services/auth.service';

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
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {
  private apiUrl = 'http://localhost:8080/api';
  private backendUrl = 'http://localhost:8080';

  profile: UserProfile | null = null;

  username = '';
  email = '';
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  selectedFile: File | null = null;
  avatarPreviewUrl = '';

  loading = false;
  saving = false;
  uploading = false;

  message = '';
  error = '';

  imageChangedEvent: Event | null = null;
  croppedAvatarBlob: Blob | null = null;
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
  ) {}

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
    this.cdr.detectChanges();

    this.http
      .get<UserProfile>(`${this.apiUrl}/users/me`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.profile = data;
          this.username = data.username;
          this.email = data.email;
          this.setAvatarFromPath(data.avatarPath);

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Nie udało się pobrać profilu.';
          this.profile = null;

          this.cdr.detectChanges();
        },
      });
  }

  saveProfile(): void {
    this.saving = true;
    this.message = '';
    this.error = '';
    this.cdr.detectChanges();

    this.http
      .put(
        `${this.apiUrl}/users/me`,
        {
          username: this.username,
          email: this.email,
        },
        {
          headers: this.getAuthHeaders(),
        },
      )
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        }),
      )
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

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Nie udało się zapisać profilu.';

          this.cdr.detectChanges();
        },
      });
  }

  onFileSelected(event: Event): void {
    this.imageChangedEvent = event;
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.croppedAvatarBlob = null;
    this.cdr.detectChanges();
  }

  imageCropped(event: ImageCroppedEvent): void {
    if (!event.blob) {
      return;
    }

    this.croppedAvatarBlob = event.blob;
  }

  uploadAvatar(): void {
    if (!this.selectedFile) {
      this.error = 'Wybierz plik avatara.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.croppedAvatarBlob) {
      this.error = 'Najpierw wykadruj avatar.';
      this.cdr.detectChanges();
      return;
    }

    const formData = new FormData();
    formData.append('file', this.croppedAvatarBlob, 'avatar.png');

    this.uploading = true;
    this.message = '';
    this.error = '';
    this.cdr.detectChanges();

    this.http
      .post<AvatarResponse>(`${this.apiUrl}/files/avatar`, formData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        finalize(() => {
          this.uploading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.message = 'Avatar został przesłany.';
          this.selectedFile = null;

          this.imageChangedEvent = null;
          this.croppedAvatarBlob = null;

          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }

          if (this.profile) {
            this.profile = {
              ...this.profile,
              avatarPath: response.avatarPath,
            };
          }
          this.auth.updateStoredUser({
            avatarPath: response.avatarPath,
          });

          const storedUserRaw = localStorage.getItem('user');

          if (storedUserRaw) {
            const storedUser = JSON.parse(storedUserRaw);

            const updatedUser = {
              ...storedUser,
              avatarPath: response.avatarPath,
              avatarUrl: response.avatarUrl,
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
          }

          this.setAvatarFromPath(response.avatarPath);

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Nie udało się przesłać avatara.';

          this.cdr.detectChanges();
        },
      });
  }

  private setAvatarFromPath(path?: string | null): void {
    if (!path) {
      this.avatarPreviewUrl = '';
      this.cdr.detectChanges();
      return;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    this.avatarPreviewUrl = `${this.backendUrl}${normalizedPath}?v=${Date.now()}`;

    this.cdr.detectChanges();
  }

  onAvatarError(): void {
    this.avatarPreviewUrl = '';
    this.cdr.detectChanges();
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
