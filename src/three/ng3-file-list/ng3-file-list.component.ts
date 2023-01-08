import { Component } from '@angular/core';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';
import { OneDriveService } from '../../OneDrive/onedrive.service';

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
  selector: 'ng3-file-list',
  templateUrl: './ng3-file-list.component.html',
  styleUrls: ['./ng3-file-list.component.css']
})
export class Ng3FileListComponent {
  protected filtereditems: Array<FileData> = [];
  protected fileid?: string;
  protected folders: Array<string | undefined> = [];

  private driveitems: Array<FileData> = [];
  private folderid?: string;

  protected filters: Array<FilterData> = [
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
  private filter: Array<string> = [''];

  protected displayfilter(item: FilterData) {
    if (item.filter) return `${item.name} (${item.filter})`
    return item.name
  }

  private getFileExtension(name: string) {
    const re: RegExp = /(?:\.([^.]+))?$/;
    const result = re.exec(name);
    if (!result) return '';

    const fileExtension = result[1] || '';
    return fileExtension;
  }

  constructor(
    private graph: OneDriveService,
  ) { }

  ngOnInit() {
    this.refresh();
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

  protected async refresh() {
    await this.getFiles(this.folderid);
  }

  private async getFiles(id?: string) {
    await this.graph.getFolderItems(id).then(data => {
      if (!data) return

      this.driveitems.length = this.filtereditems.length = 0;
      data.forEach(item => {
        if (!item.name?.startsWith('.'))
          this.addDriveItem(item);
      });
    });
  }

  protected downloadUrl?: string;

  protected async open(item: FileData) {
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

  protected async back() {
    this.fileid = this.downloadUrl = undefined;
    this.folderid = this.folders.pop();
    await this.getFiles(this.folderid);
  }

  protected async createFolder() {
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

  protected async deleteItem(fileid: string) {
    await this.graph.deleteItem(fileid).then(data => {
      this.driveitems = this.driveitems.filter(item => item.id != fileid);
      this.filtereditems = this.driveitems.filter(item => item.id != fileid);
      if (fileid == this.fileid) this.fileid = this.downloadUrl = undefined;
      if (fileid == this.folderid) this.folderid = undefined;
    });
  }

  protected async createFile() {
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

  protected async updateFile() {
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

  protected async duplicateFile(name: string) {
    if (!this.fileid) return;

    await this.graph.duplicateFile(this.fileid, 'copy of ' + name).then(data => {
      const timer = setTimeout(() => {
        this.refresh();
        clearTimeout(timer);
      }, 1000)
    });
  }

  protected async renameItem(item: FileData) {
    const newname = prompt('Enter new name', item.name);
    if (newname) {
      await this.graph.renameItem(item.id, newname).then(data => {
        if (data && data.name) {
          item.name = data.name;
        }
      });
    }
  }

  private applyfilter() {
    this.filtereditems = this.driveitems.filter(item => {
      return this.filter[0] == '' || item.isfolder || this.filter.includes(item.extension)
    });
  }

  protected changeFilter(newfilter: string) {
    this.filter = newfilter.split(',');
    this.applyfilter();
  }
}
