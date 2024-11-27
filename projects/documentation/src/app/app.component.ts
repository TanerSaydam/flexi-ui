import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    encapsulation: ViewEncapsulation.None,
    template: `
  <router-outlet></router-outlet>`
})
export class AppComponent {
}
