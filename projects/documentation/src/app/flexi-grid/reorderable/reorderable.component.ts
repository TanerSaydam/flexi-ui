import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule, FlexiGridReorderModel } from 'flexi-grid';
import { dataTSCode, reOrderableHTMLCode, reOrderableTSCode } from '../code';
import { SharedModule } from '../../shared.module';
import { moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-reorderable',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './reorderable.component.html',    
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export default class ReOrderableComponent {
  users = signal<UserModel[]>(UsersData);
  reOrderableTSCode = signal<string>(reOrderableTSCode);
  reOrderableHTMLCode = signal<string>(reOrderableHTMLCode);
  dataCode = signal<string>(dataTSCode);
  reOrderableCodeExample = signal<string>(`<flexi-grid
    .
    .
    [reorderable]="true"
    (onReorder)="onReorder($event)"
    >  
  `);  
  
  onReorder(event:FlexiGridReorderModel){
    console.log(event);
    const newData = [...this.users()];
    moveItemInArray(newData, event.previousIndex, event.currentIndex);
    this.users.set(newData);
  }
}
