import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private tokenKey = 'logged';
  private roleKey = 'userRole';

  login(email: string, password: string): boolean {
    if (password !== '1234') {
      return false;
    }

    const role = email === 'admin@test.com' ? 'admin' : 'user';
    localStorage.setItem(this.tokenKey, 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem(this.roleKey, role);
    return true;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('userEmail');
    localStorage.removeItem(this.roleKey);
  }

  isLogged(): boolean {
    return localStorage.getItem(this.tokenKey) === 'true';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  getUserRole(): string {
    return localStorage.getItem(this.roleKey) || 'user';
  }
}
