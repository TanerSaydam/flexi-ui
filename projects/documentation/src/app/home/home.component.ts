import { Component, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-home',
    imports: [
        BlankComponent,
        CardComponent,
        TranslocoModule
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    encapsulation: ViewEncapsulation.None
})
export class HomeComponent {
}
