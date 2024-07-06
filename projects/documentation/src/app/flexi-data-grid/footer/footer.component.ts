import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { footerHTMLCode, footerTSCode } from '../code';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [FlexiGridModule, FormsModule, MyCodeComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FooterComponent {
  users = signal<UserModel[]>(UsersData);
  footerTSCode = signal<string>(footerTSCode);
  footerHTMLCode = signal<string>(footerHTMLCode);
  @Input() dataCode = "";
}
