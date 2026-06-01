import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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
  private apiUrl = environment.apiUrl;
  private backendUrl = environment.backendUrl;

  profile: UserProfile | null = null;

  username = '';
  email = '';

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  avatarPreviewUrl = '';

  loading = false;
  saving = false;
  uploading = false;

  imageChangedEvent: Event | null = null;
  croppedAvatarBlob: Blob | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private toastr: ToastrService
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
    this.cdr.detectChanges();

    this.http
      .get<UserProfile>(`${this.apiUrl}/users/me`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
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

          this.profile = null;
          this.toastr.error(
            'Nie udało się pobrać profilu.',
            'Błąd profilu'
          );

          this.cdr.detectChanges();
        },
      });
  }

  saveProfile(): void {
    if (this.saving) {
      return;
    }

    if (!this.username || !this.email) {
      this.toastr.warning('Uzupełnij nazwę użytkownika i email.', 'Brak danych');
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    this.http
      .put<UserProfile>(
        `${this.apiUrl}/users/me`,
        {
          username: this.username,
          email: this.email,
        },
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updatedUser) => {
          this.profile = {
            ...(this.profile ?? updatedUser),
            username: this.username,
            email: this.email,
          };

          this.auth.updateStoredUser({
            username: this.username,
            email: this.email,
          });

          this.toastr.success('Profil został zaktualizowany.', 'Sukces');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);

          this.toastr.error(
            this.getErrorMessage(err, 'Nie udało się zapisać profilu.'),
            'Błąd profilu'
          );

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
    if (this.uploading) {
      return;
    }

    if (!this.selectedFile) {
      this.toastr.warning('Wybierz plik avatara.', 'Brak pliku');
      return;
    }

    if (!this.croppedAvatarBlob) {
      this.toastr.warning('Najpierw wykadruj avatar.', 'Brak kadrowania');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.croppedAvatarBlob, 'avatar.png');

    this.uploading = true;
    this.cdr.detectChanges();

    this.http
      .post<AvatarResponse>(`${this.apiUrl}/files/avatar`, formData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        finalize(() => {
          this.uploading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
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

          this.setAvatarFromPath(response.avatarPath);

          this.toastr.success('Avatar został zaktualizowany.', 'Sukces');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);

          this.toastr.error(
            this.getErrorMessage(err, 'Nie udało się przesłać avatara.'),
            'Błąd avatara'
          );

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

  private getErrorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string') {
      return err.error;
    }

    return err?.error?.message || err?.error?.title || err?.message || fallback;
  }
}