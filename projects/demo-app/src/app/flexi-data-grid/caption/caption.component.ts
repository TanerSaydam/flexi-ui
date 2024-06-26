import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
//import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';

@Component({
  selector: 'app-caption',
  standalone: true,
  imports: [FormsModule, FlexiGridComponent, FlexiGridColumnComponent],
  templateUrl: './caption.component.html',
  styleUrl: './caption.component.css'
})
export class CaptionComponent {
  users = signal<UserModel[]>(UsersData);
  showCaption = signal<boolean>(true);
  captionTitle = signal<string>("User list");
  showColumnVisibility = signal<boolean>(true);
  showRefreshData = signal<boolean>(true);

  refreshData(){
    //Do something...
  }
}
