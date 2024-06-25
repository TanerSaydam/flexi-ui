import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FlexiGridComponent } from '../../../flexi-grid/src/public-api';
import { UserModel } from './models/user.model';
import { HttpClient } from '@angular/common/http';
import { FlexiGridColumnComponent } from '../../../flexi-grid/src/lib/flexi-grid-column.component';
import { StateFilterModel, StateModel } from '../../../flexi-grid/src/lib/state.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FlexiGridComponent, FlexiGridColumnComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);

  constructor(
    private http: HttpClient
  ){
    this.getAll();
    //this.getAllWithNoOData();
  }

  getAll(){
    this.loading.set(true);

    let endpoint = `https://localhost:7032/api/Users/GetAll?$count=true&$top=${this.state().pageSize}&$skip=${this.state().skip}`;

    if(this.state().order.field !== ''){
      endpoint += `&$orderby=${this.toTitleCase(this.state().order.field)}`;
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
          filterValue += `${this.toTitleCase(val.field)} eq ${isoDate}`;
        }
        else if(val.type === "date-time"){
          const date = new Date(val.value);
          const isoDate = date.toISOString()
          filterValue += `${this.toTitleCase(val.field)} eq ${isoDate}`;
        }
        else if(val.type === "number"){
          if(val.operator === "contains") val.operator = "eq";
          filterValue += `${this.toTitleCase(val.field)} ${val.operator} ${val.value}`;
        }
        else if(val.type === "text"){
          switch (val.operator) {
            case "contains":
              filterValue += `contains(${this.toTitleCase(val.field)}, '${val.value}')`;
              break;
            case "not contains":
              filterValue += `not(contains(${this.toTitleCase(val.field)}, '${val.value}'))`;
              break;
            case "startswith":
              filterValue += `startswith(${this.toTitleCase(val.field)}, '${val.value}')`;
              break;
            case "endswith":
              filterValue += `endswith(${this.toTitleCase(val.field)}, '${val.value}')`;
              break;
            case "eq":
            case "ne":
              filterValue += `${this.toTitleCase(val.field)} ${val.operator} '${val.value}'`;
              break;
            default:
              filterValue += `${this.toTitleCase(val.field)} ${val.operator} '${val.value}'`;
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

  getAllWithNoOData(){
    this.loading.set(true);

    let endpoint = `https://localhost:7032/api/Users/GetAll`;
    
    this.http.get(endpoint).subscribe((res:any)=> {
      this.users.set(res.data);
      this.total.set(res.data.length);      
      this.loading.set(false);
    });
  }

  dataStateChange(event:any){
    console.log(event);
    this.state.set(event);
    this.getAll();
  }

  toTitleCase(str: string) {
    return str
      .split(' ') // Metni boşluklardan ayırarak kelimelere bölüyoruz.
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Her kelimenin ilk harfini büyük yapıyoruz.
      .join(' '); // Kelimeleri tekrar birleştiriyoruz.
  }
}
