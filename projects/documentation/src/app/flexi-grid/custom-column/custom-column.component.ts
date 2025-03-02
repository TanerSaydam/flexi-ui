import { Component, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { customColumnHTMLCode, customColumnTSCode, dataTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-custom-column',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './custom-column.component.html',
    styleUrl: './custom-column.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class CustomColumnComponent {
  users = signal<UserModel[]>(UsersData);
  customColumnTSCode = signal<string>(customColumnTSCode);
  customColumnHTMLCode = signal<string>(customColumnHTMLCode);
  dataCode = signal<string>(dataTSCode);
  customColumnCodeExample = signal<string>(`
  <flexi-grid
      [data]="users()"
      [commandColumnTextAlign]="'center'"
      [stickyCommandColumn]="true"
      [showCommandColumn]="true">

    <!-- Öncelikle custom column yerleştireceğimiz yerin içine girip flexiGridCellTemplate attribute'ünü yazıyoruz. Otomatik olarak column içindeki değeri columnda gösteriyor.-->
    <!-- let-item ile o döngüdeki tüm değerleri yakalıyoruz -->
    <!-- let-rowIndex="rowIndex" ile index'i yakalıyoruz -->
    <flexi-grid-column title="Custom Column">
      <ng-template flexiGridHeaderTemplate>
        <!-- Eklediğiniz özel column a özel filter alanı da ekleyebiliyorsunuz -->
        <input type="search" class="flexi-grid-filter-input" (keyup)="onKeyUp($event)" placeholder="Custom filter...">
      </ng-template>
      <ng-template flexiGridCellTemplate let-item let-rowIndex="rowIndex">
        This Column: {{item.salary}} || bu da index: {{rowIndex}}
      </ng-template>
    </flexi-grid-column>

    <ng-template flexiGridColumnCommandTemplate let-item let-index="index">
      <flexi-button (click)="edit(item.id)" btnColor="primary" btnIcon="edit" btnSize="x-small" flexiTooltip title="Edit" />
      <flexi-button (click)="remove(item.id)" class="ms-1" btnColor="danger"  btnIcon="delete" btnSize="x-small" flexiTooltip title="Remove" />
    </ng-template>
    `);

  edit(id: any){}

  remove(id: any){}

  onKeyUp(event:any){
    const value = event.target.value;
  }
}
