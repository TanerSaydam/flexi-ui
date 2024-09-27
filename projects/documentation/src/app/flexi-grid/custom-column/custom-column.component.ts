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

    <!-- Öncelikle custom column yerleştireceğimiz yere böyle bir işaretleyici koyuyoruz -->
    <flexi-grid-column field="salary" title="Salary" [columnTemplate]="customSalaryColumnTemplate"></flexi-grid-column>
  
    <!-- let-salary="value" ile value değerindeki bu döngüde gelen salary field değerini yakalıyoruz -->
    <!-- let-item="item" ile bu döngüdeki tüm datayı yakalıyoruz -->
    <ng-template #customSalaryColumnTemplate let-salary="value" let-item="item">
      <!--{{ salary }}Bu direkt işaretlediğimiz column da field değerine karşılık değeri alır-->
      {{ item.salary | currency: '': '' }} <!--Bu o döngüdeki tüm datayı alır. İçerisinden istediğiniz field a erişebilirsiniz-->
    </ng-template>
  
    <ng-template #customButtonColumnTemplate let-item="item">
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
