import { Component, ViewChild } from "@angular/core";
import { InteractiveObjects, MenuItem } from "ng3-flat-ui";

import { MeshBasicMaterial } from "three";

import { Ng3FileListComponent } from "../ng3-file-list/ng3-file-list.component";
import { OneDriveService } from "../../OneDrive/onedrive.service";
import { FilterData } from "../../OneDrive/file-list";

@Component({
  selector: 'three-scene',
  templateUrl: './scene.component.html',
  //styleUrls: ['./scene.component.css']
  providers: [OneDriveService],
})
export class ThreeSceneComponent {
  @ViewChild(Ng3FileListComponent) filelist!: Ng3FileListComponent;

  selectable = new InteractiveObjects();

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

  menuitems: Array<MenuItem> = [
    { text: 'Create Folder', keycode: '', icon: 'create_new_folder', enabled: true, color: new MeshBasicMaterial({ color: 'yellow' }), selected: () => { this.createFolder(); } },
  //  { text: 'Create File', keycode: 'Ctrl+N', icon: 'note_add', enabled: true, selected: () => { this.createFile(); } },
  //  { text: 'Update File', keycode: 'Ctrl+S', icon: 'save', enabled: true, selected: () => { this.updateFile(); } },
  ]

  browse = true;

  showprompt = false
  prompttitle = '';
  promptvalue = '';

  constructor(public onedrive: OneDriveService) { }

  open(downloadurl: string) {
    console.warn('open', downloadurl);
    this.browse = false;

    const timer = setTimeout(() => {
      this.browse = true;
      clearTimeout(timer);
    }, 2000)
  }

  promptresult(result?: string) {
    if (result) {
      this.filelist.createFolder(result)
    }
  }

  protected async createFolder() {
    this.prompttitle = 'Enter folder name'
    this.promptvalue = 'newfolder';
    this.showprompt = true;
  }

}
