import { Component, ViewEncapsulation, input } from '@angular/core';

@Component({
    selector: 'app-card',
    imports: [],
    templateUrl: './card.component.html',
    styleUrl: './card.component.css',
    encapsulation: ViewEncapsulation.None
})
export class CardComponent {
  readonly cardTitle = input<string>("");
}
