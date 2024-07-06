import { Component, Renderer2, signal } from '@angular/core';
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
import { FlexiToastService } from '../../../../flexi-toast/src/lib/flexi-toast.service';
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
    public shared: SharedService,
    private toast: FlexiToastService
  ){
    this.state().pageSize = 500;
    this.getAll();
    toast.options.position = "bottom-right";
    toast.options.autoClose = true;
    toast.options.themeClass = "light";
    toast.options.timeOut = 4000;
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
    // const user1 = this.users().find(p=> p.id === this.userId1());
    // const user2 = this.users().find(p=> p.id === this.userId2());
    // this.userId1.set("");
    this.toast.showToast("Success","Create is successful", "success");
    this.toast.showToast("Info","Update is successful", "info");
    this.toast.showToast("Error","Something went wrong", "error");
    this.toast.showToast("Warning","You need to fix this", "warning");
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


