import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import { OneDriveService } from '../../OneDrive/onedrive.service';

import { FileData, FilterData } from '../../OneDrive/file-list';
import { FlatUIInputService, InteractiveObjects, ListItem, MenuItem } from 'ng3-flat-ui';
import { NgtObjectProps } from '@angular-three/core';
import { Group, MeshBasicMaterial } from 'three';

@Component({
  selector: 'ng3-file-list',
  exportAs: 'Ng3FileList',
  templateUrl: './ng3-file-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FlatUIInputService],
})
export class Ng3FileListComponent extends NgtObjectProps<Group> {
  @Input() width = 2;

  private _height = 1;
  @Input()
  get height(): number { return this._height }
  set height(newvalue: number) {
    this._height = newvalue;
    this.rowcount = Math.round((newvalue - 0.26) / (this.rowheight + 0.01));
  }

  private _filters: Array<FilterData> = [
    { name: 'All Files', filter: '' },
  ]

  @Input()
  get filters(): Array<FilterData> { return this._filters }
  set filters(newvalue: Array<FilterData>) {
    this._filters = newvalue;
    this.filterlist = this.filters.map(item => <ListItem>{ text: this.displayfilter(item) });
  }

  protected filterlist: Array<ListItem> = [{ text: 'All Files' }];

  @Input() filterlistwidth = 1;
  protected get filterlistheight(): number { return (this.filterlist.length * 0.11) + 0.06 }

  @Input()
  set addmenuitems(newvalue: Array<MenuItem>) {
    this.menuitems.push(...newvalue);
  }

  @Input() selectable?: InteractiveObjects;

  @Output() fileselected = new EventEmitter<string>();

  protected rowheight = 0.2;
  protected rowcount = 4;

  protected filtereditems: Array<ListItem> = [];
  protected filtervalue = 'All Files';

  protected fileid?: string;
  protected folders: Array<string | undefined> = [];

  protected menuitems: Array<MenuItem> = [
    { text: 'Back', keycode: 'Backspace', icon: 'arrow_back', enabled: false, selected: () => { this.back() } },
    { text: 'Refresh', keycode: 'F5', icon: 'refresh', enabled: true, selected: () => { this.refresh(); } },
  //  { text: 'Create Folder', keycode: '', icon: 'create_new_folder', enabled: true, color: new MeshBasicMaterial({ color: 'yellow' }), selected: () => { this.createFolder(); } },
  //  { text: 'Create File', keycode: 'Ctrl+N', icon: 'note_add', enabled: true, selected: () => { this.createFile(); } },
  //  { text: 'Update File', keycode: 'Ctrl+S', icon: 'save', enabled: true, selected: () => { this.updateFile(); } },
  ]
  protected menuwidth = 0;

  private driveitems: Array<FileData> = [];
  private folderid?: string;


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

  private sizes: Array<string> = ['bytes', 'KB', 'MB', 'GB', 'TB']

  private fileSize(size: number): string {
    let index = 0;
    while (size > 1024) {
      index++;
      size /= 1024;
    }
    return `${size.toFixed(1).replace('.0', '')} ${this.sizes[index]} - `;
  }

  constructor(
    private graph: OneDriveService,
    public input: FlatUIInputService,
    private cd: ChangeDetectorRef,
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();

    this.refresh();

  }

  private addDriveItem(item: MicrosoftGraph.DriveItem) {
    const driveitem = <FileData>{
      isfolder: item.folder != undefined,
      name: item.name,
      id: item.id,
      extension: item.name ? this.getFileExtension(item.name) : '',
      lastmodified: item.lastModifiedDateTime,
      size: item.size ? this.fileSize(item.size) : ''
    }

    this.driveitems.push(driveitem);

  }

  protected async refresh() {
    await this.getFiles(this.folderid);
  }

  private async getFiles(id?: string) {
    await this.graph.getFolderItems(id).then(data => {
      if (!data) return

      this.driveitems.length = 0;
      data.forEach(item => {
        if (!item.name?.startsWith('.'))
          this.addDriveItem(item);
      });
      this.applyfilter();
    });
  }

  protected downloadUrl?: string;

  protected async open(item: FileData) {
    if (!item.id) return;

    const back = this.menuitems[0];
    //const updatefile = this.menuitems[3];

    if (item.isfolder) {
      this.folders.push(this.folderid);
      back.enabled = true;

      await this.getFiles(item.id);
      this.folderid = item.id;
      this.fileid = this.downloadUrl = undefined;
      //updatefile.enabled = false;
    }
    else {
      await this.graph.getDownloadUrl(item.id).then(data => {
        this.downloadUrl = data;
        this.fileid = item.id;
        //updatefile.enabled = true;
        if (data) this.fileselected.next(data);
      });
    }
    this.cd.detectChanges();
  }

  protected async back() {
    this.fileid = this.downloadUrl = undefined;
    this.folderid = this.folders.pop();
    await this.getFiles(this.folderid);

    const back = this.menuitems[0];
    back.enabled = this.folders.length > 0;
  }

  async createFolder(foldername: string) {
    if (!this.folderid) return;

    await this.graph.createFolder(foldername, this.folderid).then(data => {
      if (data) {
        this.addDriveItem(data);
        this.applyfilter();
      }
    });
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

        this.applyfilter();
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
          this.cd.detectChanges();
        }
      }
    });
  }

  protected async duplicateFile(item: FileData) {
    await this.graph.duplicateFile(item.id, 'copy of ' + item.name).then(data => {
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
          this.cd.detectChanges();
        }
      });
    }
  }

  private applyfilter() {
    const driveitems = this.driveitems.filter(item => {
      return this.filter[0] == '' || item.isfolder || this.filter.includes(item.extension)
    });
    this.filtereditems = driveitems.map(item => <ListItem>{ text: item.name, data: item });
    this.cd.detectChanges();
  }

  protected changeFilter(newfilter: string) {
    if (newfilter == this.filtervalue) return;

    this.filtervalue = newfilter;
    const item = this.filters.find(item => newfilter.startsWith(item.name));
    if (item) {
      this.filter = item.filter.split(',');
      this.applyfilter();
    }
  }
}
