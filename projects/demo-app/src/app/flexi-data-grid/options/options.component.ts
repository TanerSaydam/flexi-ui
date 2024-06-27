import { Component, ViewEncapsulation, signal } from '@angular/core';
//import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { optionsHTMLCode, optionsTSCode } from '../code';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [FlexiGridColumnComponent, FlexiGridComponent, FormsModule, MyCodeComponent],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class OptionsComponent {
  users = signal<UserModel[]>(UsersData);
  height = signal<string>("420px");
  idWidth = signal<string>("100%");
  firstNameWidth = signal<string>("100%");
  lastNameWidth = signal<string>("100%");
  dateOfBirthWidth = signal<string>("100%");
  salaryWidth = signal<string>("100%");
  visibleIdColumn = signal<boolean>(true);
  visibleFirstNameColumn = signal<boolean>(true);
  visibleLastNameColumn = signal<boolean>(true);
  visibleDateOfBirthColumn = signal<boolean>(true);
  visibleSalaryColumn = signal<boolean>(true);
  autoHeight = signal<boolean>(false);
  useMinWidth = signal<boolean>(true);
  minWidth = signal<string>("1050px");
  autoWidth = signal<boolean>(true);
  width = signal<string>("100%");
  optionsTSCode = signal<string>(optionsTSCode);
  optionsHTMLCode = signal<string>(optionsHTMLCode);
}
