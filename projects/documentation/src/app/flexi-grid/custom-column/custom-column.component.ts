import { Component, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { customColumnHTMLCode, customColumnTSCode, dataTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-custom-column',
  standalone: true,
  imports: [
    FlexiGridModule,
    SharedModule
  ],
  templateUrl: './custom-column.component.html',
  styleUrl: './custom-column.component.css',
  encapsulation: ViewEncapsulation.None,
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
    <flexi-grid-column field="salary" title="Salary">      
      <ng-template flexiGridCellTemplate let-item let-rowIndex="rowIndex">
        Bu column değeri: {{item.salary}} || bu da index: {{rowIndex}}
      </ng-template>
    </flexi-grid-column>  
  
    <ng-template #customButtonColumnTemplate let-item let-index="index">
      <!--# ile ng-template oluşturup onu commandColumnTemplate'e verirsek command alanı columnların en sonunda gözükür. Sticky yapabiliyoruz bu sayede overflow olursa kaymıyor, text-align yapabiliriz.-->
      <!-- flexi-button grid ile beraber gelen bir component. İsterseniz uygulamanızda kullanabilirsiniz. -->
      <flexi-button (click)="edit(item.id)" btnColor="primary" [outline]="true">
          <i class="fa-solid fa-edit"></i>
      </flexi-button>
      <flexi-button (click)="remove(item.id)" class="ms-1" btnColor="danger" [outline]="true">
          <i class="fa-solid fa-trash"></i>
      </flexi-button>
    </ng-template>
    `);
  edit(id: any){

  }

  remove(id: any){

  }
}
