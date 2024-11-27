import { Component, ViewEncapsulation } from '@angular/core';
import { CardComponent } from '../blank/card/card.component';

@Component({
    selector: 'app-loading',
    imports: [CardComponent],
    templateUrl: './loading.component.html',
    styleUrl: './loading.component.css',
    encapsulation: ViewEncapsulation.None
})
export class LoadingComponent {

}
