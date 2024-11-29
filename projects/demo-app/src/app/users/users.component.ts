import { Component, inject } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/modules/flexi-grid.module';
import { RolesData } from '../../../../documentation/src/app/flexi-grid/data';


@Component({
    imports: [
    BlankComponent,
    FlexiGridModule
],
    templateUrl: './users.component.html',
    styleUrl: './users.component.css'
})
export class UsersComponent {
  data = RolesData  

  constructor(){    
  }
}