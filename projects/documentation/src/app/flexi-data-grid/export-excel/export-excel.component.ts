import { Component, ViewEncapsulation, signal } from '@angular/core';
import { StateModel, FlexiGridService, FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { exportExcelHTMLCode, exportExcelTSCode } from '../code';
import { FormsModule } from '@angular/forms';
import { UserModel } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-export-excel',
  standalone: true,
  imports: [FlexiGridModule, FormsModule, MyCodeComponent],
  templateUrl: './export-excel.component.html',
  styleUrl: './export-excel.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ExportExcelComponent {
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
  exportExcelTSCode = signal<string>(exportExcelTSCode);
  exportExcelHTMLCode = signal<string>(exportExcelHTMLCode);
  
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
  
  exportExcel(){
    this.http.get("https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll").subscribe((res:any)=> {
      this.flexi.exportDataToExcel(res.data, "my-excel");
    })  
  }
}
