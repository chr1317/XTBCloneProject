import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {

    return this.http.post<any>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {

        localStorage.setItem('token', response.token);

        localStorage.setItem(
          'user',
          JSON.stringify(response.user)
        );
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) : null;
  }

  isAdmin(): boolean {
  const user = this.getUser();
  return user?.role === 'Admin';
}
getUserEmail(): string | null {
  const user = this.getUser();
  return user?.email ?? null;
}

register(username: string, email: string, password: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/register`, {
    username,
    email,
    password
  });
}
}