import { Component } from '@angular/core';
import { AuthenticationResult } from '@azure/msal-browser';
import { AuthService, User } from './auth.service';


@Component({
  selector: 'app-onedrive',
  templateUrl: './onedrive.component.html',
})
export class OneDriveComponent {
  get authenticated(): boolean {
    return this.authService.authenticated;
  }
  // The user
  get user(): User | undefined {
    return this.authService.user;
  }

  constructor(private authService: AuthService) { }

  ngOnInit() {
    // Necessary to handle logout redirect properly
    // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md
    this.authService.handleRedirects().subscribe({
      next: (result: AuthenticationResult) => { },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  async signIn(): Promise<void> {
    await this.authService.signIn();
  }

  signOut(): void {
    this.authService.signOut();
  }

}
