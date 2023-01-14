import { Component } from "@angular/core";
import { InteractiveObjects } from "ng3-flat-ui";
import { FilterData } from "../../OneDrive/file-list";

@Component({
  selector: 'three-scene',
  templateUrl: './scene.component.html',
  //styleUrls: ['./scene.component.css']
})
export class ThreeSceneComponent {
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

  browse = true;

  open(downloadurl: string) {
    console.warn('open', downloadurl);
    this.browse = false;

    const timer = setTimeout(() => {
      this.browse = true;
      clearTimeout(timer);
    }, 2000)
  }
}
