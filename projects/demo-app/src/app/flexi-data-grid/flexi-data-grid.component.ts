import { Component, signal } from '@angular/core';
import { FlexiGridComponent } from '../../../../flexi-grid/src/public-api';
import { FlexiGridColumnComponent } from '../../../../flexi-grid/src/lib/flexi-grid-column.component';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StateModel, StateFilterModel } from '../../../../flexi-grid/src/lib/state.model';
import { UserModel } from '../models/user.model';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { FlexiGridService } from '../../../../flexi-grid/src/lib/flexi-grid.service';

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

    let endpoint = `https://localhost:7032/api/Users/GetAll?$count=true&$top=${this.state().pageSize}&$skip=${this.state().skip}`;

    if(this.state().order.field !== ''){
      endpoint += `&$orderby=${this.flexi.toTitleCase(this.state().order.field)}`;
      if(this.state().order.dir === 'desc'){
        endpoint += ` desc`;
      }
    }

    if (this.state().filter.length > 0) {
      endpoint += `&$filter=`;
      let filterValue: string = "";
    
      this.state().filter.forEach((val: StateFilterModel) => {
        if (filterValue !== "") {
          filterValue = filterValue + " and ";
        }
    
        if(val.type === "date"){
          const date = new Date(val.value);
          const isoDate = date.toISOString().split('T')[0];
          filterValue += `${this.flexi.toTitleCase(val.field)} eq ${isoDate}`;
        }
        else if(val.type === "date-time"){
          const date = new Date(val.value);
          const isoDate = date.toISOString()
          filterValue += `${this.flexi.toTitleCase(val.field)} eq ${isoDate}`;
        }
        else if(val.type === "number"){
          if(val.operator === "contains") val.operator = "eq";
          filterValue += `${this.flexi.toTitleCase(val.field)} ${val.operator} ${val.value}`;
        }
        else if(val.type === "text"){
          switch (val.operator) {
            case "contains":
              filterValue += `contains(${this.flexi.toTitleCase(val.field)}, '${val.value}')`;
              break;
            case "not contains":
              filterValue += `not(contains(${this.flexi.toTitleCase(val.field)}, '${val.value}'))`;
              break;
            case "startswith":
              filterValue += `startswith(${this.flexi.toTitleCase(val.field)}, '${val.value}')`;
              break;
            case "endswith":
              filterValue += `endswith(${this.flexi.toTitleCase(val.field)}, '${val.value}')`;
              break;
            case "eq":
            case "ne":
              filterValue += `${this.flexi.toTitleCase(val.field)} ${val.operator} '${val.value}'`;
              break;
            default:
              filterValue += `${this.flexi.toTitleCase(val.field)} ${val.operator} '${val.value}'`;
              break;
          }
        }

        
      });
      endpoint += filterValue;
    }

    this.http.get(endpoint).subscribe((res:any)=> {
      this.users.set(res.data);
      this.total.set(res.total);      
      this.loading.set(false);
    });
  }

  getAll2(){
    this.loading.set(true);

    let oDataEndpointPart = this.flexi.getODataEndpoint(this.state());
    let endpoint = `https://localhost:7032/api/Users/GetAll?$count=true&${oDataEndpointPart}`;

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
