import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
//import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { draggableHTMLCode, draggableTSCode } from '../code';

@Component({
  selector: 'app-draggable',
  standalone: true,
  imports: [FlexiGridComponent, FlexiGridColumnComponent, MyCodeComponent],
  templateUrl: './draggable.component.html',
  styleUrl: './draggable.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class DraggableComponent {
  users = signal<UserModel[]>(UsersData);
  draggableTSCode = signal<string>(draggableTSCode);
  draggableHTMLCode = signal<string>(draggableHTMLCode);
  @Input() dataCode = "";
}
