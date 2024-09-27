import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { FlexiGridModule } from 'flexi-grid';
import { captionHTMLCode, captionTSCode, dataTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-caption',
  standalone: true,
  imports: [
    FlexiGridModule, 
    SharedModule  
  ],
  templateUrl: './caption.component.html',
  styleUrl: './caption.component.css',
  encapsulation: ViewEncapsulation.None,
})
export default class CaptionComponent {
  users = signal<UserModel[]>(UsersData);
  showCaption = signal<boolean>(true);
  captionTitle = signal<string>("User list");
  showColumnVisibility = signal<boolean>(true);
  columnVisibilityBtnClass = signal<string>("flexi-grid-btn");
  showRefreshBtn = signal<boolean>(true);
  refreshDataBtnClass = signal<string>("flexi-grid-btn");
  captionTSCode = signal<string>(captionTSCode);
  captionHTMLCode = signal<string>(captionHTMLCode);
  dataCode = signal<string>(dataTSCode);
  captionCodeExample = signal<string>(`<flexi-grid
    .
    .
    [showCaption]="true"
    [showColumnVisibility]="true" <!-- Columnlarınızı gizleyip açabilmeniz için kullanabileceğiniz button -->
    [showRefreshBtn]="true" <!-- Verilerinizi yenilemek için kullanabileceğiniz button -->
    [captionTemplate]="captionTemplate"  <!-- Yukarıdaki butonların yanına yeni elementler ekleyebilirsiniz -->
    >
    
    <!-- İsterseniz ek elmentler ekleyebiliyorsunuz. Buraya ekledikleriniz grid captionın sağ tarafında görünür -->
    <ng-template #captionTemplate>
      <flexi-button btnColor="default">
          <i class="fa-solid fa-plus me-1"></i>
           Kullanıcı ekle
      </flexi-button>
    </ng-template>
  `);
  refreshData(){
    //Do something...
  }
}
