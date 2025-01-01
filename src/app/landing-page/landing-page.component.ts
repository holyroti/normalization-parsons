import { Component } from '@angular/core';
import {  Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ToolbarComponent } from '../toolbar/toolbar.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, ToolbarComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  showAchievements = false;
  showInfo = false;
  username: string = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').username || 'Guest';

  
  constructor(private router: Router) {}

  ngOnInit(): void {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
      this.router.navigate(['/']); // Redirect to login if not logged in
    }
  }
  

  logout(): void {
    sessionStorage.clear();
    window.location.reload(); // Reload to clear state
  }


  startGame(): void {
    console.log("Navigating to Parsons Problem page");
    this.router.navigate(['/parsons']); // Navigate to the /parsons route
  }
  
  openAchievements(): void {
    this.showAchievements = true;
  }

  closeAchievements(): void {
    this.showAchievements = false;
  }

  openInfo(): void {
    this.showInfo = true;
  }

  closeInfo(): void {
    this.showInfo = false;
  }
}
