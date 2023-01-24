import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { CookieService } from 'ngx-cookie-service';

import { Box3, BufferGeometry, Group, Object3D, Scene, Vector3 } from "three";
import { PLYLoader, PLYExporter } from 'three-stdlib';
import { NgtLoader } from "@angular-three/core";

import { InteractiveObjects, MenuItem } from "ng3-flat-ui";
import { FileData, FilterData } from "ngx-cloud-storage-types";
import { FileSelected, Ng3FileListComponent, SaveFile } from "ng3-file-list";
import { OneDriveService } from "ngx-cloud-storage-onedrive";



@Component({
  selector: 'three-scene',
  templateUrl: './scene.component.html',
  providers: [CookieService]
})
export class ThreeSceneComponent {
  @ViewChild(Ng3FileListComponent) filelist!: Ng3FileListComponent;

  selectable = new InteractiveObjects();
  z = 0;

  projectroot?: string

  filters: Array<FilterData> = [
    //  { name: 'All Files', filter: '' },
    //  { name: 'Models', filter: 'ply,glft' },
    //  { name: 'Textures', filter: 'png,jpg' },
    //  { name: 'Images', filter: 'png,jpg' },
    //  { name: 'SVG', filter: 'svg' },
    //  { name: 'Materials', filter: 'json' },
    //  { name: 'Fonts', filter: 'json' },
    //  { name: 'Animation Clips', filter: 'json' },
    //  { name: 'Audio', filter: 'ogg' },
  ]
  foldersfilter = [
    { name: 'Select Folder', filter: 'folder' },
  ]
  modelsfilter = [
    { name: 'Models', filter: 'glb' },
    { name: 'Models', filter: 'ply' },
  ]


  menuitems: Array<MenuItem> = [
    //{ text: 'Create Folder', keycode: '', icon: 'create_new_folder', enabled: true, color: new MeshBasicMaterial({ color: 'yellow' }), selected: () => { this.createFolder(); } },
    //  { text: 'Create File', keycode: 'Ctrl+N', icon: 'note_add', enabled: true, selected: () => { this.createFile(); } },
    //  { text: 'Update File', keycode: 'Ctrl+S', icon: 'save', enabled: true, selected: () => { this.updateFile(); } },
  ]

  browse = false;
  browseheight = 1;

  geometry!: BufferGeometry;
  meshheight = 0.05;
  selectfolder = false;

  constructor(
    public onedrive: OneDriveService,
    private loader: NgtLoader,
    private cookie: CookieService,
    private cd: ChangeDetectorRef
  ) {
    this.projectroot = this.cookie.get('projectroot');
  }

  loadfile() {
    this.filters = this.modelsfilter;
    this.browse = !this.browse;
    this.selectfolder = false;
  }

  private loadPLY(downloadUrl: string) {
    const s = this.loader.use(PLYLoader, downloadUrl).subscribe(next => {
      next.center();
      if (next.boundingBox)
        this.meshheight = (next.boundingBox.max.y - next.boundingBox.min.y) / 2;

      if (this.geometry) this.geometry.dispose();
      this.geometry = next;
    },
      () => { },
      () => { s.unsubscribe(); }
    );
  }

  scene!: Group;

  loaded(scene: Scene) {
    const box = new Box3().setFromObject(scene)
    const size = new Vector3()
    box.getSize(size);
    this.scene.scale.setScalar(1 / size.length());
    this.meshheight = 0.25;
    this.cd.detectChanges();
  }

  showmodel = false
  url!: string;

  open(file: FileSelected) {
    this.browse = false;
    switch (file.item.extension) {
      case 'ply':
        this.loadPLY(file.downloadUrl);
        this.showmodel = true
        break;
      case 'gltf':
      case 'glb':
        this.showmodel = false;
        this.url = file.downloadUrl;
        break;
    }

    this.filename = file.item.name;
  }

  log(type: string, data: FileData) {
    console.warn(type, data);
  }

  saveparams?: SaveFile;
  filename?: string;

  private getContent(object: Object3D): string {
    const exporter = new PLYExporter();
    return <string>exporter.parse(object, undefined, {});
  }

  saveasfile(object: Object3D) {
    this.filters = this.modelsfilter;
    this.browse = true;

    // wait for browser to open
    const timer = setTimeout(() => {
      this.saveparams = {
        prompttitle: 'Enter file name', promptvalue: this.filename ? 'copy of ' + this.filename : 'file.ply',
        content: this.getContent(object), conflictBehavior: 'replace'
      }
      //this.saveparams = {
      //  filename: 'file.ply', content: 'Text content'
      //}
      clearTimeout(timer);
    }, 1000 / 60)
  }

  savefile(mesh: Object3D) {
    if (this.filename) {
      this.onedrive.createFile(this.projectroot, this.filename, this.getContent(mesh));
    }
  }

  changeproject() {
    this.filters = this.foldersfilter;
    this.selectfolder = this.browse = true;
  }

  folderselected(item: FileData) {
    this.projectroot = item.id;
    this.filename = undefined;
    this.selectfolder = this.browse = false;
    this.cookie.set('projectroot', this.projectroot);
  }

  close() {
    this.selectfolder = this.browse = false
  }
}
