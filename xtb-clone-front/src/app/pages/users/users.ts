import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class UsersComponent {

  users: User[] = [
    { id: 1, firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.com', role: 'Admin' },
    { id: 2, firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.com', role: 'User' }
  ];

  editUser: User | null = null;

  deleteUser(id: number) {
    this.users = this.users.filter(u => u.id !== id);
  }

  startEdit(user: User) {
    this.editUser = { ...user };
  }

  saveUser() {
    if (!this.editUser) return;

    const index = this.users.findIndex(u => u.id === this.editUser!.id);
    if (index !== -1) {
      this.users[index] = this.editUser;
    }

    this.editUser = null;
  }

  addUser() {
    const newUser: User = {
      id: Date.now(),
      firstName: '',
      lastName: '',
      email: '',
      role: 'User'
    };

    this.users.unshift(newUser);
    this.editUser = newUser;
  }
}