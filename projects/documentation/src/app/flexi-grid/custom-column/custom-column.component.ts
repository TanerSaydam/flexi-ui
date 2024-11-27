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
      [commandColumnTemplate]="customButtonColumnTemplate" 
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
        Bu column değeri: {{item.salary}} || bu da index: {{rowIndex}}
      </ng-template>
    </flexi-grid-column>  
  
    <ng-template #customButtonColumnTemplate let-item let-index="index">
      <!--# ile ng-template oluşturup onu commandColumnTemplate'e verirsek command alanı columnların en sonunda gözükür. 
      Sticky yapabiliyoruz bu sayede overflow olursa kaymıyor, text-align yapabiliriz.-->
      <!-- flexi-button grid ile beraber gelen bir component. İsterseniz uygulamanızda kullanabilirsiniz. -->
      <flexi-button (click)="edit(item.id)" btnColor="primary" btnIcon="edit" btnSize="small" flexiTooltip title="Güncelle" />
      <flexi-button (click)="remove(item.id)" class="ms-1" btnColor="danger"  btnIcon="delete" btnSize="small" flexiTooltip title="Sil" />
    </ng-template>
    `);
  edit(id: any){

  }

  remove(id: any){

  }

  onKeyUp(event:any){
    const value = event.target.value;
  }
}
