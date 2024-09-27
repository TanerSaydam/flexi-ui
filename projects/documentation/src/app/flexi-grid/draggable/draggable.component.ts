import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { dataTSCode, draggableHTMLCode, draggableTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-draggable',
  standalone: true,
  imports: [
    FlexiGridModule,
    SharedModule
  ],
  templateUrl: './draggable.component.html',
  styleUrl: './draggable.component.css',
  encapsulation: ViewEncapsulation.None,
})
export default class DraggableComponent {
  users = signal<UserModel[]>(UsersData);
  draggableTSCode = signal<string>(draggableTSCode);
  draggableHTMLCode = signal<string>(draggableHTMLCode);
  dataCode = signal<string>(dataTSCode);
  draggableCodeExample = signal<string>(`<flexi-grid
    .
    .
    [draggable]="true"
    >

    <!-- İsterseniz column bazlı draggable özelliğini kapatabilirsiniz -->
    <flexi-grid-column field="id" [draggable]="true" title="Id"></flexi-grid-column>    
  `);
}
