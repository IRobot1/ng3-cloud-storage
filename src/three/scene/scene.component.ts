import { Component } from "@angular/core";

@Component({
  selector: 'three-scene',
  templateUrl: './scene.component.html',
  //styleUrls: ['./scene.component.css']
})
export class ThreeSceneComponent {
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
