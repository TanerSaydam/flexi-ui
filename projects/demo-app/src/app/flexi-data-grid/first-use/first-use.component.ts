import { Component, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
//import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';

@Component({
  selector: 'app-first-use',
  standalone: true,
  imports: [FlexiGridComponent, FlexiGridColumnComponent],
  templateUrl: './first-use.component.html',
  styleUrl: './first-use.component.css'
})
export class FirstUseComponent {
  users = signal<UserModel[]>(UsersData);
}
