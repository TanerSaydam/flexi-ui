import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { changeThemeHTMLCode, changeThemeTSCode } from '../code';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-theme',
  standalone: true,
  imports: [FlexiGridModule, MyCodeComponent, FormsModule, CommonModule],
  templateUrl: './change-theme.component.html',
  styleUrl: './change-theme.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ChangeThemeComponent {
  users = signal<UserModel[]>(UsersData);
  changeTheme = signal<boolean>(true);
  changeThemeTSCode = signal<string>(changeThemeTSCode);
  changeThemeHTMLCode = signal<string>(changeThemeHTMLCode);
  @Input() dataCode = "";
}
