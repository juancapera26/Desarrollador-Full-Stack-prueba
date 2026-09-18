import { Component } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  styles: [
    ":host { display: block; width: 100%; height: 100%; } ion-app { display: block; width: 100%; height: 100%; }",
  ],
  template: "<ion-app><ion-router-outlet /></ion-app>",
})
export class AppComponent {}
