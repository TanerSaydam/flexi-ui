import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { customColumnHTMLCode, customColumnTSCode, firstUseHTMLCode, firstUseTSCode } from '../code';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-column',
  standalone: true,
  imports: [FlexiGridComponent, FlexiGridColumnComponent, MyCodeComponent, CommonModule],
  templateUrl: './custom-column.component.html',
  styleUrl: './custom-column.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CustomColumnComponent {
  users = signal<UserModel[]>(UsersData);
  customColumnTSCode = signal<string>(customColumnTSCode);
  customColumnHTMLCode = signal<string>(customColumnHTMLCode);
  @Input() dataCode = "";

  edit(id: any){

  }

  remove(id: any){

  }
}
