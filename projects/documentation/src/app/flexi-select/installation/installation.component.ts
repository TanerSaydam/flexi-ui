import { Component } from '@angular/core';
import { BlankComponent } from '../../blank/blank.component';
import { CardComponent } from '../../blank/card/card.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-installation',
    imports: [
        BlankComponent,
        CardComponent,
        TranslocoModule
    ],
    templateUrl: './installation.component.html',
    styleUrl: './installation.component.css'
})
export default class InstallationComponent {

}
