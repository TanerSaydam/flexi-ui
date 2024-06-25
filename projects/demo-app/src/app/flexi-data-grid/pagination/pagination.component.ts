import { Component, signal } from '@angular/core';
import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
//import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FlexiGridComponent,FlexiGridColumnComponent],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  users = signal<UserModel[]>(UsersData);
}
