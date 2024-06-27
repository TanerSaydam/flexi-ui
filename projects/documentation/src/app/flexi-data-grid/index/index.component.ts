import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
//import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { FormsModule } from '@angular/forms';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { indexHTMLCode, indexTSCode } from '../code';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [FlexiGridComponent, FlexiGridColumnComponent,FormsModule, MyCodeComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class IndexComponent {
  users = signal<UserModel[]>(UsersData);
  showIndex = signal<boolean>(true);
  indexWidth = signal<string>("70px");
  indexTSCode = signal<string>(indexTSCode);
  indexHTMLCode = signal<string>(indexHTMLCode);
  @Input() dataCode = "";
}
