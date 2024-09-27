import { Component, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { StateModel, FlexiGridService, FlexiGridModule } from 'flexi-grid';
import { dataBindingHTMLCode, dataBindingTSCode } from '../code';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-data-binding',
  standalone: true,
  imports: [
    FlexiGridModule,
    SharedModule
  ],
  templateUrl: './data-binding.component.html',
  styleUrl: './data-binding.component.css',
  encapsulation: ViewEncapsulation.None,
})
export default class DataBindingComponent {
  users = signal<UserModel[]>([]);
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);  
  dataBinding = signal<boolean>(true);
  pageable = signal<boolean>(true);
  pageSize = signal<number>(10);
  pageSizeList = signal<number[]>([3,5,10,15,20,50]);
  numbers = signal<number[]>([1,2,3,4,5,10,15,20,25,30,35,40,45,50,100,150,200]);  
  showIndex = signal<boolean>(true);
  sortable = signal<boolean>(true);
  showCaption = signal<boolean>(true);
  captionTitle = signal<string>("User list");
  showColumnVisibility = signal<boolean>(true);
  showRefreshBtn = signal<boolean>(true);
  filterable = signal<boolean>(true);
  dataBindingTSCode = signal<string>(dataBindingTSCode);
  dataBindingHTMLCode = signal<string>(dataBindingHTMLCode);

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
