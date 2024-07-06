import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { FilterType, FlexiGridModule } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { filterHTMLCode, filterTSCode } from '../code';


@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [FlexiGridModule, FormsModule, MyCodeComponent],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css',
  encapsulation: ViewEncapsulation.None,
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
  filterTSCode = signal<string>(filterTSCode);
  filterHTMLCode = signal<string>(filterHTMLCode);
  @Input() dataCode = "";
}
