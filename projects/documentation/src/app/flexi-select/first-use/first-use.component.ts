import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../../flexi-grid/data';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { firstUseHTMLCode, firstUseTSCode } from '../code';
import { FlexiSelectModule } from 'flexi-select';
import { SharedService } from '../../shared.service';
import { FormsModule } from '@angular/forms';
import { BlankComponent } from '../../blank/blank.component';
import { CardComponent } from '../../blank/card/card.component';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../../loading/loading.component';
import { dataTSCode } from '../../flexi-grid/code';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-first-use',
    imports: [
        BlankComponent,
        CardComponent,
        CommonModule,
        FlexiSelectModule,
        MyCodeComponent,
        FormsModule,
        LoadingComponent,
        TranslocoModule
    ],
    templateUrl: './first-use.component.html',
    styleUrl: './first-use.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class FirstUseComponent {
  users = signal<UserModel[]>(UsersData);
  selectedUserId = signal<string>("");
  firstUseTSCode = signal<string>(firstUseTSCode);
  firstUseHTMLCode = signal<string>(firstUseHTMLCode);
  dataCode = signal<string>(dataTSCode);
  firstUseTSCodeExample1 = signal<string>(`import { FlexiSelectComponent,FlexiOptionColumnComponent } from 'flexi-select';

    @Component({
    ..
    imports: [FlexiSelectComponent, FlexiOptionColumnComponent]
    })
    `);
  firstUseTSCodeExample2 = signal<string>(`import { FlexiSelectModule } from 'flexi-select';

    @Component({
    ..
    imports: [FlexiSelectModule]
    })
    `);
  firstUseHTMLCodeExample1 = signal<string>(firstUseHTMLCode);
  firstUseHTMLCodeExample2 = signal<string>(`<flexi-select
    ...
    id="firstSelect"
    >
    </flexi-select>`);

  constructor(
    public shared: SharedService
  ){}

  selected(event: string){
    console.log(event);    
  }
}
