import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { changeThemeHTMLCode, changeThemeTSCode, dataTSCode } from '../code';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-change-theme',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './change-theme.component.html',
    styleUrl: './change-theme.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class ChangeThemeComponent {
  users = signal<UserModel[]>(UsersData);
  changeTheme = signal<boolean>(true);
  changeThemeTSCode = signal<string>(changeThemeTSCode);
  changeThemeHTMLCode = signal<string>(changeThemeHTMLCode);
  dataCode = signal<string>(dataTSCode);
  changeThemeCodeExample = signal<string>(`<flexi-grid
    .
    .
    themeClass="light"
    >
  `)
}
