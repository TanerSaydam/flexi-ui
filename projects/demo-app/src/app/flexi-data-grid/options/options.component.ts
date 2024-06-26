import { Component, signal } from '@angular/core';
import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
//import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [FlexiGridColumnComponent, FlexiGridComponent, FormsModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class OptionsComponent {
  users = signal<UserModel[]>(UsersData);
  height = signal<number>(420);
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
}
