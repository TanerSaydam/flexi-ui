import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { dataTSCode, footerHTMLCode, footerTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-footer',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class FooterComponent {
  users = signal<UserModel[]>(UsersData);
  footerTSCode = signal<string>(footerTSCode);
  footerHTMLCode = signal<string>(footerHTMLCode);
  dataCode = signal<string>(dataTSCode);
  footerCodeExample =signal<string>(`<flexi-grid 
    ..
    [footerTemplate]="footerTemplate"
    >   
    ...

    <ng-template #footerTemplate>
        <tr style="height: 50px;">
            <th style="padding-left: 50px;" colspan="4">Total Count</th>
            <th>{{users().length}}</th>
        </tr>
    </ng-template>
  </flexi-grid>
  `);
}