import { Component } from '@angular/core';
import { AuthenticationResult } from '@azure/msal-browser';
import { User } from '@microsoft/microsoft-graph-types';
import { AuthService, OneDriveService } from 'ngx-cloud-storage-onedrive';
import { OAuthSettings } from './oauth';

@Component({
  selector: 'app-onedrive',
  templateUrl: './onedrive.component.html',
  styleUrls: ['./onedrive.component.css'],
  providers: [OneDriveService],
})
export class OneDriveComponent {
  get authenticated(): boolean {
    return this.authService.authenticated;
  }
  // The user
  get user(): User | undefined {
    return this.authService.user;
  }

  constructor(
    private authService: AuthService,
    public onedrive: OneDriveService,
  ) { }

  ngOnInit() {
    // Necessary to handle logout redirect properly
    // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md
    this.authService.handleRedirects().subscribe({
      next: async (result: AuthenticationResult) => {
        if (this.authenticated) {
        }
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  async signIn(): Promise<void> {
    await this.authService.signIn(OAuthSettings);
  }

  signOut(): void {
    this.authService.signOut();
  }
}
