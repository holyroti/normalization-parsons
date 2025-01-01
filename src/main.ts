import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { LandingPageComponent } from './app/landing-page/landing-page.component';
import { ParsonsProblemComponent } from './app/parsons-problem/parsons-problem.component';
import { LoginComponent } from './app/login/login.component';
import { ToolbarComponent } from './app/toolbar/toolbar.component';
import { ProfilePicSelectDialogComponent } from './app/profile-pic-select-dialog/profile-pic-select-dialog.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const routes: Route[] = [
  { path: '', component: LoginComponent },
  { path: 'landing', component: LandingPageComponent },          // Root route for landing page
  { path: 'parsons', component: ParsonsProblemComponent } // Route for Parsons component
];

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(HttpClientModule, BrowserAnimationsModule), // Importing modules once
    provideRouter(routes), provideAnimationsAsync()
  ]
})
  .then(() => console.log("Application started with router"))
  .catch(err => console.error("Application failed to start", err));
