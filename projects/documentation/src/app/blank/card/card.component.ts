import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-card',
    imports: [],
    templateUrl: './card.component.html',
    styleUrl: './card.component.css',
    encapsulation: ViewEncapsulation.None
})
export class CardComponent {
  @Input() cardTitle: string = "";
}
