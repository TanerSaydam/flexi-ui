import { Component, signal } from '@angular/core';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/flexi-grid.module';
import { StateModel } from '../../../../flexi-grid/src/lib/state.model';
import { FlexiGridService } from '../../../../flexi-grid/src/lib/flexi-grid.service';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../shared.service';
import { BlankComponent } from '../blank/blank.component';
import { FlexiSelectComponent } from '../../../../flexi-select/src/public-api';
import { FormsModule } from '@angular/forms';
import { FlexiOptionComponent } from '../../../../flexi-select/src/lib/flexi-option.component';
import { UsersData } from '../../../../documentation/src/app/flexi-data-grid/data'
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [BlankComponent, FlexiGridModule, FlexiSelectComponent, FormsModule, FlexiOptionComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);
  userId1 = signal<string>("");
  userId2 = signal<string>("");

  constructor(
    private http: HttpClient,
    private flexi: FlexiGridService,
    public shared: SharedService
  ){
    this.state().pageSize = 500;
    this.getAll();
  }

  getAll(){
    this.users.set(UsersData);    
    // this.loading.set(true);

    // let oDataEndpointPart = this.flexi.getODataEndpoint(this.state());
    // let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&${oDataEndpointPart}`;

    // this.http.get(endpoint).subscribe((res:any)=> {
    //   this.users.set(res.data);
    //   this.total.set(res.total);      
    //   this.loading.set(false);
    // });
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

  change(event:string){
    //console.log(event);    
  }

  save(){
    const user1 = this.users().find(p=> p.id === this.userId1());
    const user2 = this.users().find(p=> p.id === this.userId2());
    this.userId1.set("");
   // console.log(user2);
    
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