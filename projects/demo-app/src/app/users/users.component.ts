import { Component } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiButtonComponent } from '../../../../flexi-button/src/lib/flexi-button.component';


@Component({
    imports: [    
    BlankComponent,
    FlexiButtonComponent
],
    templateUrl: './users.component.html',
    styleUrl: './users.component.css'
})
export class UsersComponent {
  
}