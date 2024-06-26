import { Component, signal } from '@angular/core';
//import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';
import { FilterType } from '../../../../../../dist/flexi-grid';


@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [FlexiGridComponent,FlexiGridColumnComponent, FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css'
})
export class FilterComponent {
  users = signal<UserModel[]>(UsersData);
  filterable = signal<boolean>(true);
  idFilterable = signal<boolean>(true);
  idFilterType = signal<FilterType>("text");
  firstNameFilterable = signal<boolean>(true);
  firstNameFilterType = signal<FilterType>("text");
  lastNameFilterable = signal<boolean>(true);
  lastNameFilterType = signal<FilterType>("text");
  dateOfBirthFilterable = signal<boolean>(true);
  dateOfBirthFilterType = signal<FilterType>("date");
  salaryFilterable = signal<boolean>(true);
  salaryFilterType = signal<FilterType>("number");
}
