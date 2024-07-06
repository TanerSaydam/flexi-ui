import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { sortHTMLCode, sortTSCode } from '../code';


@Component({
  selector: 'app-sort',
  standalone: true,
  imports: [FlexiGridModule, FormsModule, MyCodeComponent],
  templateUrl: './sort.component.html',
  styleUrl: './sort.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class SortComponent {
  users = signal<UserModel[]>(UsersData);
  sortable = signal<boolean>(true);
  idSortable = signal<boolean>(true);
  firstNameSortable = signal<boolean>(true);
  lastNameSortable = signal<boolean>(true);
  dateOfBirthSortable = signal<boolean>(true);
  salarySortable = signal<boolean>(true);
  sortTSCode = signal<string>(sortTSCode);
  sortHTMLCode = signal<string>(sortHTMLCode);
  @Input() dataCode = "";
}
