import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { customOptionTSCode, customOptionHTMLCode } from '../code';
import { FlexiSelectModule } from 'flexi-select';
import { SharedService } from '../../shared.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { dataTSCode } from '../../flexi-grid/code';
import { CommonModule } from '@angular/common';
import { BlankComponent } from '../../blank/blank.component';
import { CardComponent } from '../../blank/card/card.component';
import { LoadingComponent } from '../../loading/loading.component';

@Component({
  selector: 'app-custom-option',
  standalone: true,
  imports: [
    BlankComponent, 
    CardComponent, 
    CommonModule, 
    LoadingComponent,
    FlexiSelectModule, 
    MyCodeComponent, 
    FormsModule,
  ],
  templateUrl: './custom-option.component.html',
  styleUrl: './custom-option.component.css',
  encapsulation: ViewEncapsulation.None,
})
export default class CustomOptionComponent {
  users = signal<UserModel[]>([]);
  selectedUserId = signal<string>("");
  customOptionTSCode = signal<string>(customOptionTSCode);
  customOptionHTMLCode = signal<string>(customOptionHTMLCode);
  dataCode = signal<string>(dataTSCode);
  customOptionHTMLCodeExample = signal<string>(customOptionHTMLCode);
  
  constructor(
    public shared: SharedService,
    private http: HttpClient
  ){
    this.getAll();
  }

  getAll(){
    let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll`;

    this.http.get(endpoint).subscribe((res:any)=> {
      this.users.set(res.data);
    });
  } 

}
