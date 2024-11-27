import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { dataTSCode, resizableHTMLCode, resizableTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-resizable',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './resizable.component.html',
    styleUrl: './resizable.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class ResizableComponent {
  users = signal<UserModel[]>(UsersData);
  resizableTSCode = signal<string>(resizableTSCode);
  resizableHTMLCode = signal<string>(resizableHTMLCode);
  dataCode = signal<string>(dataTSCode);
  resizableCodeExample = signal<string>(`<flexi-grid
    .
    .
    [resizable]="true"
    >

    <!-- İsterseniz column bazlı resizable özelliğini kapatabilirsiniz -->
    <flexi-grid-column field="id" [resizable]="false" title="Id"></flexi-grid-column>    
  `);
}
