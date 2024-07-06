import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { firstUseHTMLCode, firstUseTSCode } from '../code';

@Component({
  selector: 'app-first-use',
  standalone: true,
  imports: [FlexiGridModule, MyCodeComponent],
  templateUrl: './first-use.component.html',
  styleUrl: './first-use.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FirstUseComponent {
  users = signal<UserModel[]>(UsersData);
  firstUseTSCode = signal<string>(firstUseTSCode);
  firstUseHTMLCode = signal<string>(firstUseHTMLCode);
  @Input() dataCode = "";
}
