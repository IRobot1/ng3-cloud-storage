import { Component } from '@angular/core';
import { AuthenticationResult } from '@azure/msal-browser';
import { AuthService, User } from './auth.service';
import { OneDriveService } from './onedrive.service';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

interface FileData {
  isfolder: boolean,
  id: string;
  name: string;
  extension: string;
  lastmodified: string;
}

interface FilterData {
  name: string,
  filter: string,
}

@Component({
  selector: 'app-onedrive',
  templateUrl: './onedrive.component.html',
  styleUrls: ['./onedrive.component.css']
})
export class OneDriveComponent {
  filtereditems: Array<FileData> = [];
  driveitems: Array<FileData> = [];
  folders: Array<string | undefined> = [];
  folderid?: string;
  fileid?: string;

  filters: Array<FilterData> = [
    { name: 'All Files', filter: '' },
    { name: 'Models', filter: 'ply,glft' },
    { name: 'Textures', filter: 'png,jpg' },
    { name: 'Images', filter: 'png,jpg' },
    { name: 'SVG', filter: 'svg' },
    { name: 'Materials', filter: 'json' },
    { name: 'Fonts', filter: 'json' },
    { name: 'Animation Clips', filter: 'json' },
    { name: 'Audio', filter: 'ogg' },
  ]
  filter: Array<string> = [''];

  displayfilter(item: FilterData) {
    if (item.filter) return `${item.name} (${item.filter})`
    return item.name
  }

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
    private graph: OneDriveService,
  ) { }

  ngOnInit() {
    // Necessary to handle logout redirect properly
    // See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md
    this.authService.handleRedirects().subscribe({
      next: async (result: AuthenticationResult) => {
        if (this.authenticated) {
          this.refresh();
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
    const driveitem = <FileData>{
      isfolder: item.folder != undefined,
      name: item.name,
      id: item.id,
      extension: item.name ? this.getFileExtension(item.name) : '',
      lastmodified: item.lastModifiedDateTime,
    }

    this.driveitems.push(driveitem);

    if (this.filter[0] == '' || driveitem.isfolder || this.filter.includes(driveitem.extension)) {
      this.filtereditems.push(driveitem);
    }
  }

  async refresh() {
    await this.getFiles(this.folderid);
  }

  async getFiles(id?: string) {
    await this.graph.getFolderItems(id).then(data => {
      if (!data) return

      this.driveitems.length = this.filtereditems.length = 0;
      data.forEach(item => {
        if (!item.name?.startsWith('.'))
          this.addDriveItem(item);
      });
    });
  }

  downloadUrl?: string;

  async open(item: FileData) {
    if (!item.id) return;
    if (item.isfolder) {
      this.folders.push(this.folderid);
      await this.getFiles(item.id);
      this.folderid = item.id;
      this.fileid = this.downloadUrl = undefined;
    }
    else {
      await this.graph.getDownloadUrl(item.id).then(data => {
        this.downloadUrl = data;
        this.fileid = item.id;
      });
    }
  }

  async up() {
    this.fileid = this.downloadUrl = undefined;
    this.folderid = this.folders.pop();
    await this.getFiles(this.folderid);
  }

  async createFolder() {
    if (!this.folderid) return;

    const foldername = prompt('Enter folder name', 'newfolder');
    if (foldername) {
      await this.graph.createFolder(foldername, this.folderid).then(data => {
        if (data) {
          this.addDriveItem(data);
        }
      });
    }
  }

  async deleteItem(fileid: string) {
    await this.graph.deleteItem(fileid).then(data => {
      this.driveitems = this.driveitems.filter(item => item.id != fileid);
      this.filtereditems = this.driveitems.filter(item => item.id != fileid);
      if (fileid == this.fileid) this.fileid = this.downloadUrl = undefined;
      if (fileid == this.folderid) this.folderid = undefined;
    });
  }

  async createFile() {
    if (!this.folderid) return;

    const filename = prompt('Enter file name', 'test.txt');
    if (filename) {
      await this.graph.createFile(this.folderid, filename, "The contents of the file goes here.").then(data => {
        if (!data) return;

        this.addDriveItem(data);
        this.fileid = data.id;
      });
    }
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

  async duplicateFile(name: string) {
    if (!this.fileid) return;

    await this.graph.duplicateFile(this.fileid, 'copy of ' + name).then(data => {
      const timer = setTimeout(() => {
        this.refresh();
        clearTimeout(timer);
      }, 1000)
    });
  }

  async renameItem(item: FileData) {
    const newname = prompt('Enter new name', item.name);
    if (newname) {
      await this.graph.renameItem(item.id, newname).then(data => {
        if (data && data.name) {
          item.name = data.name;
        }
      });
    }
  }

  applyfilter() {
    this.filtereditems = this.driveitems.filter(item => {
      return this.filter[0] == '' || item.isfolder || this.filter.includes(item.extension)
    });
  }

  changeFilter(newfilter: string) {
    this.filter = newfilter.split(',');
    this.applyfilter();
  }
}
