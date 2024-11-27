import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { dataTSCode, firstUseHTMLCode, firstUseTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-first-use',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './first-use.component.html',
    styleUrl: './first-use.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class FirstUseComponent {
  users = signal<UserModel[]>(UsersData);
  firstUseTSCode = signal<string>(firstUseTSCode);
  firstUseHTMLCode = signal<string>(firstUseHTMLCode);
  dataCode = signal<string>(dataTSCode);

  firstUseTSCodeExample = signal<string>(`import { FlexiGridModule } from 'flexi-grid';

    @Component({
    ..
    imports: [FlexiGridModule]
    })
    `);
  firstUseHTMLCodeExample = signal<string>(firstUseHTMLCode);
}
