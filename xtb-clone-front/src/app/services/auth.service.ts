import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
export interface LoggedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  avatarPath?: string | null;
  balances?: {
    currency: string;
    amount: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authApiUrl = `${environment.apiUrl}/auth`;
  private usersApiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoggedUser> {
    return this.http.post<{ token: string }>(`${this.authApiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        localStorage.setItem('token', response.token);
      }),
      switchMap((response) => {
        return this.http.get<LoggedUser>(`${this.usersApiUrl}/me`, {
          headers: new HttpHeaders({
            Authorization: `Bearer ${response.token}`,
          }),
        });
      }),
      tap((user) => {
        localStorage.setItem('user', JSON.stringify(user));
      }),
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.authApiUrl}/register`, {
      username,
      email,
      password,
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUser(): LoggedUser | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  updateStoredUser(partialUser: Partial<LoggedUser>): void {
    const currentUser = this.getUser();

    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      ...partialUser,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
  }

  getUserName(): string {
    return this.getUser()?.username ?? 'Guest';
  }

  getUserEmail(): string | null {
    return this.getUser()?.email ?? null;
  }

  getUserRole(): string {
    return this.getUser()?.role ?? 'User';
  }

  getUserAvatarPath(): string | null {
    return this.getUser()?.avatarPath ?? null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'Admin';
  }

  getMe(): Observable<LoggedUser> {
    return this.http.get<LoggedUser>(`${this.usersApiUrl}/me`);
  }
}
