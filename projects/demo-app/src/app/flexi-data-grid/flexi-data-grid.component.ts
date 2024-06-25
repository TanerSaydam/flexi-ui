import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserModel } from '../models/user.model';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { FlexiGridComponent,FlexiGridColumnComponent, StateModel, FlexiGridService } from 'flexi-grid';

@Component({
  selector: 'app-flexi-data-grid',
  standalone: true,
  imports: [BlankComponent, CardComponent, FlexiGridComponent, FlexiGridColumnComponent, CommonModule],
  templateUrl: './flexi-data-grid.component.html',
  styleUrl: './flexi-data-grid.component.css'
})
export class FlexiDataGridComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private flexi: FlexiGridService
  ){
    this.getAll();
    //this.getAllWithNoOData();
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

  getAllWithNoOData(){
    this.loading.set(true);

    let endpoint = `https://localhost:7032/api/Users/GetAll`;
    
    this.http.get(endpoint).subscribe({
      next: (res:any)=> {
        this.users.set(res.data);
        this.total.set(res.data.length);      
        this.loading.set(false);
      },
      error: ()=> {
        this.loading.set(false);
      }
    });
  }

  dataStateChange(event:any){
    this.state.set(event);
    this.getAll();
  }

  
}
