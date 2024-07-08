import { Component, ViewEncapsulation, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserModel } from '../../models/user.model';
import { FlexiGridModule, StateModel, FlexiGridService } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { fullExampleHTMLCode, fullExampleTSCode } from '../code';
import { SharedService } from '../../shared.service';

@Component({
  selector: 'app-flexi-grid-full',
  standalone: true,
  imports: [FlexiGridModule, MyCodeComponent],
  templateUrl: './full.component.html',
  styleUrl: './full.component.css',
  encapsulation: ViewEncapsulation.None
})
export default class FullComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);  
  fullExampleTSCode = signal<string>(fullExampleTSCode);
  fullExampleHTMLCode =signal<string>(fullExampleHTMLCode);  

  constructor(
    private http: HttpClient,
    private flexi: FlexiGridService,
    public shared: SharedService
  ){
    this.getAll();
  }  

  getAll(){
    this.loading.set(true);

    let oDataEndpointPart = this.flexi.getODataEndpoint(this.state());
    let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&${oDataEndpointPart}`;

    this.http.get(endpoint).subscribe((res:any)=> {
      this.users.set(res.data);      
      this.total.set(res.total);      
      this.loading.set(false);
    });
  } 

  dataStateChange(event:any){
    this.state.set(event);
    this.getAll();
  }

  exportExcel(){
    this.http.get("https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll").subscribe((res:any)=> {
      this.flexi.exportDataToExcel(res.data, "my-excel");
    })  
  }
}
