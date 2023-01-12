import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import { OneDriveService } from '../../OneDrive/onedrive.service';

import { FileData, FilterData } from '../../OneDrive/file-list';
import { FlatUIInputService, FlatUIList, InteractiveObjects, ListItem, MenuItem } from 'ng3-flat-ui';
import { NgtObjectProps } from '@angular-three/core';
import { Group } from 'three';

@Component({
  selector: 'ng3-file-list',
  templateUrl: './ng3-file-list.component.html',
  //changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FlatUIInputService],
})
export class Ng3FileListComponent extends NgtObjectProps<Group> {
  @Input() selectable?: InteractiveObjects;

  @ViewChild(FlatUIList) uilist!: FlatUIList;

  protected filtereditems: Array<ListItem> = [];
  protected filtervalue = 'All Files';

  protected fileid?: string;
  protected folders: Array<string | undefined> = [];

  menuitems: Array<MenuItem> = [
    { text: 'Back', keycode: 'Backspace', icon: 'arrow_back', enabled: false, selected: () => { this.back() } },
    { text: 'Create Folder', keycode: 'F2', icon: 'create_new_folder', enabled: true, selected: () => { this.createFolder(); } },
    { text: 'Create File', keycode: 'Ctrl+N', icon: 'note_add', enabled: true, selected: () => { this.createFile(); } },
    { text: 'Update File', keycode: 'Ctrl+S', icon: 'save', enabled: this.downloadUrl == undefined, selected: () => { this.updateFile(); } },
    { text: 'Refresh', keycode: 'F5', icon: 'refresh', enabled: true, selected: () => { this.refresh(); } },
  ]
  protected menuwidth = 0;

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
  protected filterlist: Array<ListItem> = [];

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
    public input: FlatUIInputService,
    private cd : ChangeDetectorRef,
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();

    this.filterlist = this.filters.map(item => <ListItem>{ text: this.displayfilter(item) });

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
      this.filtereditems.push({ text: driveitem.name, data: driveitem });
    }
  }

  protected async refresh() {
    await this.getFiles(this.folderid);
    this.cd.detectChanges();
    this.uilist.movefirst();
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
      this.filtereditems = this.driveitems.filter(item => item.id != fileid).map(item => <ListItem>{ text: item.name, data: item });
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
    }).map(item => <ListItem>{ text: item.name, data: item});
  }

  protected changeFilter(newfilter: string) {
    this.filtervalue = newfilter;
    this.filter = newfilter.split(',');
    this.applyfilter();
  }
}
