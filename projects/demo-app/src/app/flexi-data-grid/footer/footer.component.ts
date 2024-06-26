import { Component, signal } from '@angular/core';
import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
//import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [FlexiGridColumnComponent, FlexiGridComponent, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  users = signal<UserModel[]>(UsersData);
}
