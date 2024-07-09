export const  fullExampleTSCode: string = `
import { Component, signal } from '@angular/core';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { UserModel } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../../shared.service';
import { FlexiSelectModule } from 'flexi-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-flexi-select-full',
  standalone: true,
  imports: [MyCodeComponent, FlexiSelectModule, FormsModule],
  templateUrl: './full.component.html',
  styleUrl: './full.component.css'
})
export default class FullComponent {
  users = signal<UserModel[]>([]);
  selectedUserId = signal<string>("");

  constructor(
    private http: HttpClient,    
    public shared: SharedService
  ){
    this.getAll();
  }  

  getAll(){
    let endpoint = 'https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll';

    this.http.get(endpoint).subscribe((res:any)=> {
      this.users.set(res.data.map((val:any)=> ({...val, fullName: val.firstName + " " + val.lastName})));
    });
  } 

  selected(event: string){
    console.log(event);    
  }

}
`;

export const fullExampleHTMLCode: string = `
<flexi-select
  [data]="users()"
  label="fullName"
  value="id"
  [themeClass]="shared.themeClass"
  [(ngModel)]="selectedUserId"
  (selected)="selected($event)">
`;

export const firstUseTSCode: string = `
import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../../flexi-data-grid/data';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { FlexiSelectModule } from 'flexi-select';
import { SharedService } from '../../shared.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-first-use',
  standalone: true,
  imports: [FlexiSelectModule, MyCodeComponent, FormsModule],
  templateUrl: './first-use.component.html',
  styleUrl: './first-use.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FirstUseComponent {
  users = signal<UserModel[]>(UsersData);
  selectedUserId = signal<string>("");
  @Input() dataCode = "";

  constructor(
    public shared: SharedService
  ){}

  selected(event: string){
    console.log(event);    
  }
}
`;

export const firstUseHTMLCode: string = `
<flexi-select
  [data]="users()"
  label="firstName"
  value="id"
  [themeClass]="shared.themeClass"
  [(ngModel)]="selectedUserId"
  (selected)="selected($event)">
`;

export const customOptionTSCode: string = `
import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../../flexi-data-grid/data';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { FlexiSelectModule } from 'flexi-select';
import { SharedService } from '../../shared.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-first-use',
  standalone: true,
  imports: [FlexiSelectModule, MyCodeComponent, FormsModule],
  templateUrl: './first-use.component.html',
  styleUrl: './first-use.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FirstUseComponent {
  users = signal<UserModel[]>(UsersData);
  selectedUserId = signal<string>("");
  @Input() dataCode = "";

  constructor(
    public shared: SharedService
  ){}
}
`;

export const customOptionHTMLCode: string = `
<flexi-select [(ngModel)]="selectedUserId" name="selectedUserId" [themeClass]="shared.themeClass">
  @for (user of users(); track user.id) {
    <flexi-option [value]="user.id">{{user.firstName}} {{user.lastName}}</flexi-option>
  }
</flexi-select>
`;

export const multipleTSCode: string = `
import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../../flexi-data-grid/data';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { FlexiSelectModule } from 'flexi-select';
import { SharedService } from '../../shared.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-first-use',
  standalone: true,
  imports: [FlexiSelectModule, MyCodeComponent, FormsModule],
  templateUrl: './first-use.component.html',
  styleUrl: './first-use.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class MultipleComponent {
  users = signal<UserModel[]>(UsersData);
  selectedUserIds = signal<string[]>([]);
  @Input() dataCode = "";

  constructor(
    public shared: SharedService
  ){}

  selected(event: string){
    console.log(event);    
  }
}
`;

export const multipleHTMLCode: string = `
<flexi-select
  [data]="users()"
  label="firstName"
  value="id"
  [multiple]="true"
  [closeAfterSelect]="false"
  [themeClass]="shared.themeClass"
  [(ngModel)]="selectedUserIds"
  height="100%"
  (selected)="selected($event)"
  >
  </flexi-select>
`;