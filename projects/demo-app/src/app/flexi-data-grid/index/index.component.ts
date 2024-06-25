import { Component, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
//import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [FlexiGridComponent, FlexiGridColumnComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css'
})
export class IndexComponent {
  users = signal<UserModel[]>(UsersData);
}
