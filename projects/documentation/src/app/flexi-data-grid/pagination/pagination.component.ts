import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { paginationHTMLCode, paginationTSCode } from '../code';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FlexiGridModule, FormsModule, MyCodeComponent],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class PaginationComponent {
  users = signal<UserModel[]>(UsersData);
  pageable = signal<boolean>(true);
  pageSize = signal<number>(10);
  pageSizeList = signal<number[]>([3,5,10,15,20,50]);
  numbers = signal<number[]>([1,2,3,4,5,10,15,20,25,30,35,40,45,50,100,150,200]);  
  paginationTSCode = signal<string>(paginationTSCode);
  paginationHTMLCode = signal<string>(paginationHTMLCode);
  @Input() dataCode = "";
}
