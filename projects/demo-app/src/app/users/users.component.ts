import { Component } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiButtonComponent } from '../../../../flexi-button/src/lib/flexi-button.component';
import { FlexiGridModule } from "../../../../flexi-grid/src/lib/modules/flexi-grid.module";
import { UsersData } from '../../../../documentation/src/app/flexi-grid/data';

@Component({
    selector: 'app-users',
    imports: [
        BlankComponent,
        FlexiButtonComponent,
        FlexiGridModule
    ],
    templateUrl: './users.component.html',
    styleUrl: './users.component.css'
})
export class UsersComponent {
  data = UsersData
}