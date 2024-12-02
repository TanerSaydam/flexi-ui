import { Component } from '@angular/core';
import { BlankComponent } from '../../blank/blank.component';
import { CardComponent } from '../../blank/card/card.component';

@Component({
    selector: 'app-installation',
    imports: [
        BlankComponent,
        CardComponent,
    ],
    templateUrl: './installation.component.html',
    styleUrl: './installation.component.css'
})
export default class InstallationComponent {

}
