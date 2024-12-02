import { Component, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { dataTSCode, paginationHTMLCode, paginationTSCode } from '../code';
import { SharedModule } from '../../shared.module';
import { FlexiSelectComponent } from "../../../../../flexi-select/src/lib/flexi-select.component";
import { FlexiSelectModule } from 'flexi-select';

@Component({
    selector: 'app-pagination',
    imports: [
    FlexiGridModule,
    SharedModule,
    FlexiSelectModule
],
    templateUrl: './pagination.component.html',
    styleUrl: './pagination.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class PaginationComponent {
  users = signal<UserModel[]>(UsersData);
  pageable = signal<boolean>(true);
  pageSize = signal<number>(5);
  pageSizeList = signal<number[]>([3,5,10,15,20,50]);
  numbers = signal<number[]>([1,2,3,4,5,10,15,20,25,30,35,40,45,50,100,150,200]);  
  paginationTSCode = signal<string>(paginationTSCode);
  paginationHTMLCode = signal<string>(paginationHTMLCode);
  dataCode = signal<string>(dataTSCode);
  paginationCodeExample = signal<string>(`<flexi-grid
    .
    .
    [pageable]="true"
    [pageSize]="5" <!--  İsteğe bağlı değiştirebilirsiniz. Default değeri 10 -->
    >
  `);
}
