import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';

import { Group, MeshBasicMaterial, Object3D } from 'three';

import { ConflictBehavior, FileData, FilterData, Ng3FileList } from '../../OneDrive/file-list';
import { FlatUIInputService, InteractiveObjects, ListItem, MenuItem } from 'ng3-flat-ui';
import { NgtObjectProps } from '@angular-three/core';

export interface SaveFile {
  prompttitle: string,
  promptvalue: string,
  conflictBehavior: ConflictBehavior,
  content: string,
}

@Component({
  selector: 'ng3-file-list[service]',
  exportAs: 'Ng3FileList',
  templateUrl: './ng3-file-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FlatUIInputService],
})
export class Ng3FileListComponent extends NgtObjectProps<Group> {
  @Input() service!: Ng3FileList;

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
    this.changeFilter(this.filterlist[0].text);
  }

  protected filtereditems: Array<ListItem> = [];
  protected filtervalue = 'All Files';
  protected filterlist: Array<ListItem> = [{ text: 'All Files' }];

  @Input() filterlistwidth = 1;
  protected get filterlistheight(): number { return (this.filterlist.length * 0.11) + 0.06 }

  @Input()
  set addmenuitems(newvalue: Array<MenuItem>) {
    this.menuitems.push(...newvalue);
  }

  @Input() selectable?: InteractiveObjects;

  private folderid?: string;
  private _startfolderid: string | undefined;
  @Input()
  get startfolderid(): string | undefined { return this._startfolderid }
  set startfolderid(newvalue: string | undefined) {
    this._startfolderid = this.folderid = newvalue;
  }

  @Input() selectfolder = false;

  private _savefile!: SaveFile;
  @Input()
  get savefile(): SaveFile { return this._savefile }
  set savefile(newvalue: SaveFile | undefined) {
    console.warn('savefile', newvalue)
    if (!newvalue || !this.listobject) return;

    this._savefile = newvalue;
    this.createFilePrompt(newvalue.prompttitle, newvalue.promptvalue, newvalue.content, newvalue.conflictBehavior);
  }

  @Output() fileselected = new EventEmitter<string>();
  @Output() folderselected = new EventEmitter<FileData>();
  @Output() foldercreated = new EventEmitter<FileData>();
  @Output() deleted = new EventEmitter<FileData>();
  @Output() renamed = new EventEmitter<FileData>();
  @Output() saved = new EventEmitter<FileData>();
  @Output() close = new EventEmitter<void>();

  protected listobject!: Object3D;

  protected rowheight = 0.2;
  protected rowcount = 4;

  protected fileid?: string;
  protected folders: Array<string | undefined> = [];

  protected menuitems: Array<MenuItem> = [
    { text: 'Back', keycode: 'Backspace', icon: 'arrow_back', enabled: false, selected: () => { this.back() } },
    { text: 'Refresh', keycode: 'F5', icon: 'refresh', enabled: true, selected: () => { this.refresh(); } },
    { text: 'Create Folder', keycode: '', icon: 'create_new_folder', enabled: true, color: new MeshBasicMaterial({ color: 'yellow' }), selected: () => { this.createFolder(); } },
    //  { text: 'Create File', keycode: 'Ctrl+N', icon: 'note_add', enabled: true, selected: () => { this.createFile(); } },
    //  { text: 'Update File', keycode: 'Ctrl+S', icon: 'save', enabled: true, selected: () => { this.updateFile(); } },
  ]
  protected menuwidth = 0;

  private driveitems: Array<FileData> = [];


  private filter: Array<string> = [''];

  protected displayfilter(item: FilterData) {
    if (item.filter) return `${item.name} (${item.filter})`
    return item.name
  }

  constructor(
    public input: FlatUIInputService,
    private cd: ChangeDetectorRef,
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();

    this.refresh();

  }

  protected async refresh() {
    await this.getFiles(this.folderid);
  }

  private async getFiles(id?: string) {
    await this.service.getFolderItems(id).then(data => {
      this.driveitems = data;
      this.applyFilter();
    });
  }

  protected downloadUrl?: string;

  protected async openFile(item: FileData) {
    if (!item.id) return;

    const back = this.menuitems[0];

    if (item.isfolder) {
      this.folders.push(this.folderid);
      back.enabled = true;

      await this.getFiles(item.id);
      this.folderid = item.id;
      this.fileid = this.downloadUrl = undefined;
    }
    else {
      await this.service.getDownloadUrl(item.id).then(data => {
        this.downloadUrl = data;
        this.fileid = item.id;
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

  protected async createFolder() {
    await this.prompt('Enter folder name', 'newfolder').then(async foldername => {
      if (!foldername) return;

      await this.service.createFolder(foldername, this.folderid).then(data => {
        if (data) {
          this.driveitems.push(data);
          this.applyFilter();

          this.foldercreated.next(data);
        }
      });
    });
  }

  protected async deleteItem(item: FileData) {
    const fileid = item.id;
    await this.service.deleteItem(fileid).then(data => {
      this.driveitems = this.driveitems.filter(item => item.id != fileid);
      this.filtereditems = this.driveitems.filter(item => item.id != fileid).map(item => <ListItem>{ text: item.name, data: item });

      if (fileid == this.fileid) this.fileid = this.downloadUrl = undefined;
      if (fileid == this.folderid) this.folderid = undefined;

      this.deleted.next(item);
    });
  }

  private async createFile(filename: string, content: string, conflictBehaivor: ConflictBehavior, folderid?: string) {
    await this.service.createFile(folderid, filename, content, conflictBehaivor).then(data => {
      if (!data) return;

      this.driveitems.push(data);
      this.fileid = data.id;
      this.saved.next(data);
      this.close.next();
    });
  }

  public async createFilePrompt(title: string, defaultfile: string, content: string, conflictBehaivor: ConflictBehavior) {

    await this.prompt(title, defaultfile).then(async filename => {

      if (filename) {
        await this.createFile(filename, content, conflictBehaivor, this.folderid);
      }
      this.close.next();
    })
  }

  protected async updateFile() {
    if (!this.fileid) return;

    await this.service.updateFile(this.fileid, "New contents: " + Date.now().toString()).then(data => {
      if (data && data.lastmodified) {
        const file = this.driveitems.find(item => item.id == this.fileid);
        if (file) {
          file.lastmodified = data.lastmodified;
          this.cd.detectChanges();
        }
      }
    });
  }

  protected async duplicateFile(item: FileData) {
    await this.service.duplicateFile(item.id, 'copy of ' + item.name).then(data => {
      const timer = setTimeout(() => {
        this.refresh();
        clearTimeout(timer);
      }, 1000)
    });
  }

  protected async renameItem(item: FileData) {
    await this.prompt('Enter new name', item.name).then(async newname => {
      if (newname) {
        await this.service.renameItem(item.id, newname).then(data => {
          if (data && data.name) {
            item.name = data.name;
            this.cd.detectChanges();

            this.renamed.next(item);
          }
        });
      }
    })
  }

  private applyFilter() {
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
      this.applyFilter();
    }
  }


  showconfirm = false;

  confirm() {
    this.showconfirm = true;
  }

  showprompt = false;
  prompttitle!: string;
  promptvalue!: string;

  protected prompt(title: string, defaultvalue: string): Promise<string | undefined> {
    this.prompttitle = title;
    this.promptvalue = defaultvalue;
    this.showprompt = true;

    return new Promise((resolve, reject) => {
      this.listobject.addEventListener('prompt', (e: any) => {
        if (e)
          resolve(e.result);
        else
          reject();
      })
    });
  }

  protected promptresult(result?: string) {
    this.listobject.dispatchEvent({ type: 'prompt', result });
    this.showprompt = false;
  }
}
