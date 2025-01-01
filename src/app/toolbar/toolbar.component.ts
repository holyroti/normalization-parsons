import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ProfilePicSelectDialogComponent } from '../profile-pic-select-dialog/profile-pic-select-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { AchievementsDialogComponent } from '../achievements-dialog/achievements-dialog.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule, 
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent {
  @Input() username: string = 'Guest';
  progress = 30; // Initialize and update this value as the user progresses through questions
  showInfo = false;
  showAchievements = false;

  badges = [
    { name: "Beginner", image: "path/to/beginner-badge.png" },
    { name: "Intermediate", image: "path/to/intermediate-badge.png" },
    { name: "Expert", image: "path/to/expert-badge.png" }
  ];


  constructor(private router: Router, public dialog: MatDialog) {}

  openProfilePicSelectDialog(): void {
    const dialogRef = this.dialog.open(ProfilePicSelectDialogComponent, {
      width: '250px',
      data: { profilePics: [{ url: 'assets/profile1.jpg' }, { url: 'assets/profile2.jpg' }] }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Profile picture selected:', result);
        // Here you can handle the selected profile picture, such as saving it to the user's profile
      }
    });
  }

  openSettings(): void {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The settings dialog was closed');
      // Optional: handle results from the dialog if necessary
    });
  }



  openAchievements(): void {
    const dialogRef = this.dialog.open(AchievementsDialogComponent, {
      width: '500px'
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('The achievements dialog was closed');
    });
  }

  openInfo(): void {
    console.log('Info modal opened');
    this.showInfo = true;
  }

  closeInfo(): void {
    console.log('Info modal closed');
    this.showInfo = false;
  }

  logout(): void {
    console.log('User logged out.');
    sessionStorage.clear();
    window.location.reload();
  }

  navigateHome(): void {
    this.router.navigate(['/landing']); // navigates to the root page
  }
}
