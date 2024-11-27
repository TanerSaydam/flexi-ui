import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { dataTSCode, sortHTMLCode, sortTSCode } from '../code';
import { SharedModule } from '../../shared.module';


@Component({
    selector: 'app-sort',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './sort.component.html',
    styleUrl: './sort.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class SortComponent {
  users = signal<UserModel[]>(UsersData);
  sortable = signal<boolean>(true);
  idSortable = signal<boolean>(true);
  firstNameSortable = signal<boolean>(true);
  lastNameSortable = signal<boolean>(true);
  dateOfBirthSortable = signal<boolean>(true);
  salarySortable = signal<boolean>(true);
  sortTSCode = signal<string>(sortTSCode);
  sortHTMLCode = signal<string>(sortHTMLCode);
  dataCode = signal<string>(dataTSCode);  
  sortCodeExample = signal<string>(`<flexi-grid
    .
    .
    [sortable]="true"
    >

    <!-- İsterseniz column bazlı sort özelliğini kapatabilirsiniz -->
    <flexi-grid-column field="id" [sortable]="false" title="Id"></flexi-grid-column>
  `);
}
