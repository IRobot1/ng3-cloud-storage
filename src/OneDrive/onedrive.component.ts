import { Component } from '@angular/core';
import { AuthenticationResult } from '@azure/msal-browser';
import { AuthService, User } from './auth.service';
import { GraphService } from './graph.service';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

interface FileData {
  isfolder: boolean,
  id: string;
  name: string;
  extension: string;
  lastmodified: string;
}

@Component({
  selector: 'app-onedrive',
  templateUrl: './onedrive.component.html',
  styleUrls: ['./onedrive.component.css']
})
export class OneDriveComponent {
  driveitems: Array<FileData> = [];
  folders: Array<string | undefined> = [];
  fileid?: string;

  get authenticated(): boolean {
    return this.authService.authenticated;
  }
  // The user
  get user(): User | undefined {
    return this.authService.user;
  }

  private getFileExtension(name: string) {
    const re: RegExp = /(?:\.([^.]+))?$/;
    const result = re.exec(name);
    if (!result) return '';

    const fileExtension = result[1] || '';
    return fileExtension;
  }

  constructor(
    private authService: AuthService,
    private graph: GraphService,
  ) { }

  ngOnInit() {
    // Necessary to handle logout redirect properly
    // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md
    this.authService.handleRedirects().subscribe({
      next: async (result: AuthenticationResult) => {
        if (this.authenticated) {
          await this.getFiles(this.fileid);
        }
      },
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

  async getFiles(id?: string) {
    await this.graph.getDriveItem(id).then(data => {
      if (data) {
        this.driveitems.length = 0;
        data.forEach(item => {
          this.driveitems.push(<FileData>{
            isfolder: item.folder != undefined,
            name: item.name,
            id: item.id,
            extension: item.name ? this.getFileExtension(item.name) : '',
            lastmodified: item.lastModifiedDateTime
          });
        });
      }
    });
  }

  async open(item: FileData) {
    if (!item.id) return;
    if (item.isfolder) {
      this.folders.push(this.fileid);
      await this.getFiles(item.id);
      this.fileid = item.id;
    }
    else {
      console.warn('download', item.name)
    }
  }

  async up() {
    this.fileid = this.folders.pop();
    await this.getFiles(this.fileid);
  }
}
