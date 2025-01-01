import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // For ngModel
import { CommonModule } from '@angular/common'; // For *ngIf

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule], // Add CommonModule here
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  private users = [
    { username: 'player1', password: 'password1' },
    { username: 'player2', password: 'password2' },
  ];

  constructor(private router: Router) {}

  login(): void {
    const user = this.users.find(
      (u) => u.username === this.username && u.password === this.password
    );

    if (user) {
      sessionStorage.setItem('loggedInUser', JSON.stringify(user));
      this.router.navigate(['/landing']); // Redirect to the landing page
      sessionStorage.setItem('loggedInUser', JSON.stringify({ username: this.username }));

    } else {
      this.errorMessage = 'Invalid username or password';
    }
  }
}
