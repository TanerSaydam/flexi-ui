import { Component, signal } from '@angular/core';
import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
//import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-sort',
  standalone: true,
  imports: [FlexiGridComponent,FlexiGridColumnComponent, FormsModule],
  templateUrl: './sort.component.html',
  styleUrl: './sort.component.css'
})
export class SortComponent {
  users = signal<UserModel[]>(UsersData);
  sortable = signal<boolean>(true);
  idSortable = signal<boolean>(true);
  firstNameSortable = signal<boolean>(true);
  lastNameSortable = signal<boolean>(true);
  dateOfBirthSortable = signal<boolean>(true);
  salarySortable = signal<boolean>(true);
}
