import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { resizableHTMLCode, resizableTSCode } from '../code';

@Component({
  selector: 'app-resizable',
  standalone: true,
  imports: [FlexiGridModule, MyCodeComponent],
  templateUrl: './resizable.component.html',
  styleUrl: './resizable.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ResizableComponent {
  users = signal<UserModel[]>(UsersData);
  resizableTSCode = signal<string>(resizableTSCode);
  resizableHTMLCode = signal<string>(resizableHTMLCode);
  @Input() dataCode = "";
}
