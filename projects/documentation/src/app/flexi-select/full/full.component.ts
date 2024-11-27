import { Component, signal } from '@angular/core';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { UserModel } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../../shared.service';
import { FlexiSelectModule } from 'flexi-select';
import { FormsModule } from '@angular/forms';
import { fullExampleHTMLCode, fullExampleTSCode } from '../code';

@Component({
    selector: 'app-flexi-select-full',
    imports: [MyCodeComponent, FlexiSelectModule, FormsModule],
    templateUrl: './full.component.html',
    styleUrl: './full.component.css'
})
export default class SelectFullComponent {
  users = signal<UserModel[]>([]);
  fullExampleTSCode = signal<string>(fullExampleTSCode);
  fullExampleHTMLCode =signal<string>(fullExampleHTMLCode);
  selectedUserId = signal<string>("");

  constructor(
    private http: HttpClient,    
    public shared: SharedService
  ){
    this.getAll();
  }  

  getAll(){
    let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll`;

    this.http.get(endpoint).subscribe((res:any)=> {
      this.users.set(res.data.map((val:any)=> ({...val, fullName: val.firstName + " " + val.lastName})));
    });
  } 

  selected(event: string){
    console.log(event);    
  }

}
