import { Component, signal } from '@angular/core';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/flexi-grid.module';
import { StateModel } from '../../../../flexi-grid/src/lib/state.model';
import { FlexiGridService } from '../../../../flexi-grid/src/lib/flexi-grid.service';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../shared.service';
import { BlankComponent } from '../blank/blank.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [BlankComponent, FlexiGridModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);

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

export class UserModel{
  id: string = "";
  firstName: string = "";
  lastName: string = "";
  dateOfBirth: string = "";
  salary: number = 0;
  avatarUrl: string = "";
}