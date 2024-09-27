import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule, TextAlignType } from 'flexi-grid';
import { dataTSCode, indexHTMLCode, indexTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    FlexiGridModule,
    SharedModule
  ],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  encapsulation: ViewEncapsulation.None,
})
export default class IndexComponent {
  users = signal<UserModel[]>(UsersData);
  showIndex = signal<boolean>(true);
  indexTextAlign = signal<TextAlignType>("center");
  indexWidth = signal<string>("70px");
  indexTSCode = signal<string>(indexTSCode);
  indexHTMLCode = signal<string>(indexHTMLCode);
  dataCode = signal<string>(dataTSCode);

  indexCodeExample = signal<string>(`<flexi-grid
    .
    .
    [showIndex]="true"
    indexTextAlign="center"
    indexWidth="70px" 
    <!--  İsteğe bağlı değiştirebilirsiniz. Default değeri 70px -->
    >
    `);
}
