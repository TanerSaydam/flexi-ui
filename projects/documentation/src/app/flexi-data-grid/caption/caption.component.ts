import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { captionHTMLCode, captionTSCode } from '../code';

@Component({
  selector: 'app-caption',
  standalone: true,
  imports: [FormsModule, FlexiGridModule, MyCodeComponent],
  templateUrl: './caption.component.html',
  styleUrl: './caption.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CaptionComponent {
  users = signal<UserModel[]>(UsersData);
  showCaption = signal<boolean>(true);
  captionTitle = signal<string>("User list");
  showColumnVisibility = signal<boolean>(true);
  columnVisibilityBtnClass = signal<string>("my-btn");
  showRefreshData = signal<boolean>(true);
  refreshDataBtnClass = signal<string>("my-btn");
  captionTSCode = signal<string>(captionTSCode);
  captionHTMLCode = signal<string>(captionHTMLCode);
  @Input() dataCode = "";

  refreshData(){
    //Do something...
  }
}
