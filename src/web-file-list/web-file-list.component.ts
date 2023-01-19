import { Component, Input } from '@angular/core';

import { FileData, FilterData, Ng3FileList } from '../OneDrive/file-list';

@Component({
  selector: 'web-file-list[service]',
  templateUrl: './web-file-list.component.html',
  styleUrls: ['./web-file-list.component.css']
})
export class WebFileListComponent {
  @Input() service!: Ng3FileList;

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

  ngOnInit() {
    this.refresh();
  }

  protected async refresh() {
    await this.getFiles(this.folderid);
  }

  private async getFiles(id?: string) {
    await this.service.getFolderItems(id).then(data => {
      this.driveitems = data;
      this.applyfilter();
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
      await this.service.getDownloadUrl(item.id).then(data => {
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
      await this.service.createFolder(foldername, this.folderid).then(data => {
        if (data) {
          this.driveitems.push(data);
        }
      });
    }
  }

  protected async deleteItem(fileid: string) {
    await this.service.deleteItem(fileid).then(data => {
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
      await this.service.createFile(this.folderid, filename, "The contents of the file goes here.").then(data => {
        if (!data) return;

        this.driveitems.push(data);
        this.fileid = data.id;
      });
    }
  }

  protected async updateFile() {
    if (!this.fileid) return;

    await this.service.updateFile(this.fileid, "New contents: " + Date.now().toString()).then(data => {
      if (data && data.lastmodified) {
        const file = this.driveitems.find(item => item.id == this.fileid);
        if (file) {
          file.lastmodified = data.lastmodified;
        }
      }
    });
  }

  protected async duplicateFile(name: string) {
    if (!this.fileid) return;

    await this.service.duplicateFile(this.fileid, 'copy of ' + name).then(data => {
      const timer = setTimeout(() => {
        this.refresh();
        clearTimeout(timer);
      }, 1000)
    });
  }

  protected async renameItem(item: FileData) {
    const newname = prompt('Enter new name', item.name);
    if (newname) {
      await this.service.renameItem(item.id, newname).then(data => {
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
