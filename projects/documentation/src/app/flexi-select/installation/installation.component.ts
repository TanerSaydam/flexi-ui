import { Component } from '@angular/core';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { BlankComponent } from '../../blank/blank.component';
import { CardComponent } from '../../blank/card/card.component';

@Component({
    selector: 'app-installation',
    imports: [
        BlankComponent,
        CardComponent,
        MyCodeComponent
    ],
    templateUrl: './installation.component.html',
    styleUrl: './installation.component.css'
})
export default class InstallationComponent {

}
