import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { FlexiGridModule } from 'flexi-grid';
import { captionHTMLCode, captionTSCode, dataTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-caption',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './caption.component.html',
    styleUrl: './caption.component.css',
    encapsulation: ViewEncapsulation.None
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
    [showColumnVisibility]="true"
    [showRefreshBtn]="true"
    >

    <ng-template flexiGridCaptionCommandTemplate>
      <flexi-button btnColor="primary" title="Add User" btnIcon="add" flexiTooltip=""/>
    </ng-template>
  `);

  refreshData(){
    //Do something...
  }
}
