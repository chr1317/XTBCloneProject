import { Injectable } from '@angular/core';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private users: User[] = [
    { id: 1, firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.com' },
    { id: 2, firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.com' }
  ];

  getAll(): User[] {
    return this.users;
  }

  create(user: User) {
    user.id = Date.now();
    this.users.push(user);
  }

  update(updated: User) {
    const i = this.users.findIndex(u => u.id === updated.id);
    if (i !== -1) this.users[i] = updated;
  }

  delete(id: number) {
    this.users = this.users.filter(u => u.id !== id);
  }

  uploadAvatar(id: number, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const user = this.users.find(u => u.id === id);
      if (user) user.avatar = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}