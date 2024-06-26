import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserModel } from '../../models/user.model';
import { FlexiGridColumnComponent, FlexiGridComponent,StateModel,FlexiGridService } from '../../../../../flexi-grid/src/public-api';
//import { FlexiGridComponent,FlexiGridColumnComponent, StateModel, FlexiGridService } from 'flexi-grid';

@Component({
  selector: 'app-full',
  standalone: true,
  imports: [FlexiGridColumnComponent,FlexiGridComponent],
  templateUrl: './full.component.html',
  styleUrl: './full.component.css'
})
export class FullComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);  

  constructor(
    private http: HttpClient,
    private flexi: FlexiGridService
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
}
