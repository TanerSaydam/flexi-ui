import { Component, ViewEncapsulation, input } from '@angular/core';

@Component({
    selector: 'app-blank',
    imports: [],
    templateUrl: './blank.component.html',
    styleUrl: './blank.component.css',
    encapsulation: ViewEncapsulation.None
})
export class BlankComponent {
  readonly pageName = input<string>("");
  readonly pageDescription = input<string>("");
}
