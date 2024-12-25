import { Component, ViewEncapsulation, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-card',
    imports: [TranslocoModule],
    templateUrl: './card.component.html',
    styleUrl: './card.component.css',
    encapsulation: ViewEncapsulation.None
})
export class CardComponent {
  readonly cardTitle = input<string>("");
}
