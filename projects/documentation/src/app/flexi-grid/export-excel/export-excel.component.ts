import { Component, ViewEncapsulation, signal } from '@angular/core';
import { StateModel, FlexiGridService, FlexiGridModule } from 'flexi-grid';
import { exportExcelHTMLCode, exportExcelTSCode } from '../code';
import { UserModel } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-export-excel',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './export-excel.component.html',
    styleUrl: './export-excel.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class ExportExcelComponent {
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
  exportExcelCodeExample1 = signal<string>(`<flexi-grid
    .
    .
    [showExportExcel]="true"
    exportExcelFileName="my-file" <!--  Export dosyalarınızın adı -->
    [exportExcelButtonClick]="exportExcel.bind(this)" <!-- Eğer default export şeklini kullanmak istemezseniz bu seçenek ile metodu kendiniz yönetebilirsiniz -->
    >
  `);
  exportExcelCodeExample2 = signal<string>(`
  exportExcel(){ //eğer metodumuz bu şekildise
    this.http.get("https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll").subscribe((res:any)=> {
      this.flexi.exportDataToExcel(res.data, "my-excel"); //flexi servicedeki metodu kullanarak datanızı excel export yapabilirsiniz
    })
  };

  //html tarafında aşağıdaki gibi atamalıyız
  [exportExcelButtonClick]="exportExcel.bind(this)"
    
  exportExcel = () =>{ //eğer metodumuz bu şekildise
  this.http.get("https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll").subscribe((res:any)=> {
    this.flexi.exportDataToExcel(res.data, "my-excel");
  })};
    
  //html tarafında aşağıdaki gibi atamalıyız
  [exportExcelButtonClick]="exportExcel"
  `);
  
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
