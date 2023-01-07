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

  private addDriveItem(item: MicrosoftGraph.DriveItem) {
    this.driveitems.push(<FileData>{
      isfolder: item.folder != undefined,
      name: item.name,
      id: item.id,
      extension: item.name ? this.getFileExtension(item.name) : '',
      lastmodified: item.lastModifiedDateTime,
    });
  }

  async getFiles(id?: string) {
    await this.graph.getFolderItems(id).then(data => {
      if (data) {
        this.driveitems.length = 0;
        data.forEach(item => {
          this.addDriveItem(item);
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
      await this.graph.getDownloadUrl(item.id).then(data => {
        console.warn(data);
        this.fileid = item.id;
      });
    }
  }

  async up() {
    this.fileid = this.folders.pop();
    await this.getFiles(this.fileid);
  }

  async createFolder() {
    if (!this.fileid) return;
    await this.graph.createFolder('test', this.fileid).then(data => {
      if (data) this.addDriveItem(data);
    });
  }

  async deleteItem(fileid: string, event: Event) {
    if (!this.fileid) return;
    event.stopPropagation();
    await this.graph.deleteItem(fileid).then(data => {
      this.driveitems = this.driveitems.filter(item => item.id != fileid);
    });
  }

  async createFile() {
    if (!this.fileid) return;

    await this.graph.createFile(this.fileid, 'test.txt', "The contents of the file goes here.").then(data => {
      if (data) this.addDriveItem(data);
    });
  }

  async updateFile() {
    if (!this.fileid) return;

    await this.graph.updateFile(this.fileid, "New contents: " + Date.now().toString()).then(data => {
      if (data && data.lastModifiedDateTime) {
        const file = this.driveitems.find(item => item.id == this.fileid);
        if (file) {
          file.lastmodified = data.lastModifiedDateTime;
        }
      }
    });
  }

}
