export const fullExampleTSCode: string = `
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserModel } from '../../models/user.model';
import { FlexiGridComponent,FlexiGridColumnComponent, StateModel, FlexiGridService, FlexiGridFilterDataModel } from 'flexi-grid';

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
  filterData = signal<FlexiGridFilterDataModel[]>([
    {
      value: "'Kayseri'",
      name: "Kayseri"
    },
    {
      value: "'İstanbul'",
      name: "İstanbul"
    },
    {
      value: "'Ankara'",
      name: "Ankara"
    }
  ])

  constructor(
    private http: HttpClient,
    private flexi: FlexiGridService
  ){
    this.getAll();
  }  

  getAll(){
    this.loading.set(true);

    let oDataEndpointPart = this.flexi.getODataEndpoint(this.state());
    let endpoint = 'https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&' + oDataEndpointPart;

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
`;

export const fullExampleHTMLCode: string = `
<flexi-grid
  [data]="users()"
  [total]="total()"
  [dataBinding]="true"
  [pageable]="true"
  [showIndex]="true"
  [loading]="loading()"
  [themeClass]="shared.themeClass"
  [filterable]="true"
  captionTitle="Örnek User Listesi"
  [captionTemplate]="captionTemplate"
  [showCaption]="true"
  [showExportExcelBtn]="true"
  [resizable]="true"
  (dataStateChange)="dataStateChange($event)"
  [sortable]="true"
  [showCommandColumn]="true"
  [commandColumnTemplate]="commandButtonColumnTemplate"
  commandColumnWidth="80px"
  [useMinWidth]="true"
  minWidth="1000px"
  exportExcelFileName="userlists">
  <ng-template #captionTemplate>
    <flexi-button btnColor="primary" btnIcon="add" flexiTooltip title="Ekle" />
  </ng-template>

  <flexi-grid-column [visible]="false" field="id" title="Id" [sortable]="false"></flexi-grid-column>
  <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
  <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
  <flexi-grid-column title="Custom Column">
    <ng-template flexiGridCellTemplate let-item>
      Burası Custom Column
    </ng-template>
  </flexi-grid-column>
  <flexi-grid-column field="dateOfBirth" [filterType]="'date'" format="dd.MM.yyyy"
    title="Date Of Birth"></flexi-grid-column>
  <flexi-grid-column field="salary" filterType="number" format="c" symbol="₺" textAlign="right"
    [showSymbolInFront]="true" [fraction]="2" title="Salary"></flexi-grid-column>
  <flexi-grid-column field="isActive" title="Is Active" filterType="boolean" [booleanData]="['Active','Passive']"
    textAlign="center" width="100px"></flexi-grid-column>
  <flexi-grid-column field="city" title="City" filterType="select" [filterData]="filterData()"
    textAlign="center"></flexi-grid-column>

  <ng-template #commandButtonColumnTemplate let-item="item">
    <flexi-button btnColor="primary" btnIcon="edit" btnSize="small" flexiTooltip title="Güncelle" />
    <flexi-button btnColor="danger" class="ms-1" btnSize="small" (click)="deleteByItem(item)" btnIcon="remove"
      flexiTooltip title="Sil" />
  </ng-template>
</flexi-grid>
`;

export const firstUseTSCode: string = `
import { Component, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';

@Component({
  selector: 'app-first-use',
  standalone: true,
  imports: [FlexiGridModule],
  templateUrl: './first-use.component.html',
  styleUrl: './first-use.component.css'
})
export class FirstUseComponent {
  users = signal<UserModel[]>(UsersData);
}
`;

export const firstUseHTMLCode: string = `
<flexi-grid [data]="users()">
    <flexi-grid-column field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const dataTSCode: string = `
import { UserModel } from "../models/user.model";

export const UsersData: UserModel[] = [
    {
        "id": "559e04f8-5ab6-4e15-a02b-0004b1becb9e",
        "firstName": "Amanda",
        "lastName": "Russel",
        "dateOfBirth": "1984-02-13",
        "salary": 29903.19,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/650.jpg",
        "isActive": true,
        "city": "İstanbul"
    },
    {
        "id": "4b7478e1-8c14-4416-94bf-0006669ec634",
        "firstName": "Lyle",
        "lastName": "Kulas",
        "dateOfBirth": "1961-09-20",
        "salary": 86158.14,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/801.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "b7d90a7a-0f26-4bf7-90e0-000942c50a4c",
        "firstName": "Percy",
        "lastName": "Kutch",
        "dateOfBirth": "1975-10-04",
        "salary": 64037.70,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/651.jpg",
        "isActive": true,
        "city": "Kayseri"
    },
    {
        "id": "bf9a87fd-6fca-4210-a57b-000a404d0770",
        "firstName": "Tracy",
        "lastName": "Howell",
        "dateOfBirth": "1981-11-21",
        "salary": 158386.59,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/603.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "5867ac21-4326-4fb0-9329-000d90f3736e",
        "firstName": "Doug",
        "lastName": "O'Kon",
        "dateOfBirth": "1980-09-06",
        "salary": 50571.94,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/692.jpg",
        "isActive": false,
        "city": "Ankara"
    },
    {
        "id": "baaf038b-564e-4641-9b43-000dc979e7b6",
        "firstName": "Roberto",
        "lastName": "Morar",
        "dateOfBirth": "1994-12-30",
        "salary": 60899.79,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1183.jpg",
        "isActive": false,
        "city": "Kayseri"
    },
    {
        "id": "e4390808-1a85-483a-b263-000e36da214f",
        "firstName": "Travis",
        "lastName": "Stanton",
        "dateOfBirth": "1993-12-23",
        "salary": 248658.15,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/66.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "13d00e5f-37dc-4541-896c-0016d2c8cb6f",
        "firstName": "Barbara",
        "lastName": "Treutel",
        "dateOfBirth": "1958-11-16",
        "salary": 154438.02,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/500.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "c9d72e76-1e7d-4513-af6c-001a52ec0dad",
        "firstName": "Amanda",
        "lastName": "Johnston",
        "dateOfBirth": "1967-03-07",
        "salary": 28659.93,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/227.jpg",
        "isActive": true,
        "city": "İstanbul"
    },
    {
        "id": "941fd2ba-5ba2-4be6-8280-0020988bcaaf",
        "firstName": "Franklin",
        "lastName": "Jones",
        "dateOfBirth": "1960-09-20",
        "salary": 178631.03,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/564.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "de638b4b-7b84-42f7-a9ca-0020ce4edf42",
        "firstName": "Susie",
        "lastName": "Murray",
        "dateOfBirth": "1989-10-09",
        "salary": 241803.13,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1026.jpg",
        "isActive": false,
        "city": "Ankara"
    },
    {
        "id": "afe61e10-c277-4716-9fd6-002297b32728",
        "firstName": "Ismael",
        "lastName": "Brakus",
        "dateOfBirth": "1962-01-21",
        "salary": 27399.36,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1110.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "461ee135-48d7-4b14-b923-002378182c1b",
        "firstName": "Amelia",
        "lastName": "Walker",
        "dateOfBirth": "1973-01-02",
        "salary": 101128.97,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/745.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "15a27f35-a8a8-4e05-822e-002778da22e6",
        "firstName": "Bridget",
        "lastName": "Botsford",
        "dateOfBirth": "1971-11-25",
        "salary": 169040.27,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1220.jpg",
        "isActive": false,
        "city": "Kayseri"
    },
    {
        "id": "623b3cb7-065e-4bb9-959a-002814f06529",
        "firstName": "Kerry",
        "lastName": "Doyle",
        "dateOfBirth": "1996-07-23",
        "salary": 92587.80,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1042.jpg",
        "isActive": true,
        "city": "İstanbul"
    },
    {
        "id": "23e6616b-ff44-42da-9f79-00288c7bc378",
        "firstName": "Monique",
        "lastName": "King",
        "dateOfBirth": "2002-07-27",
        "salary": 161433.63,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/798.jpg",
        "isActive": false,
        "city": "Ankara"
    },
    {
        "id": "bba89801-e468-43a2-a60a-002bcf4eddeb",
        "firstName": "Diane",
        "lastName": "Hagenes",
        "dateOfBirth": "1965-04-28",
        "salary": 160262.59,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/380.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "504fc8e1-5962-479c-abf1-0032400c194f",
        "firstName": "David",
        "lastName": "Nolan",
        "dateOfBirth": "1974-02-20",
        "salary": 21209.33,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/158.jpg",
        "isActive": true,
        "city": "Kayseri"
    },
    {
        "id": "0fc8c34c-3ee2-41b6-b251-00328c132042",
        "firstName": "Aubrey",
        "lastName": "Jacobs",
        "dateOfBirth": "1981-08-26",
        "salary": 244948.91,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/181.jpg",
        "isActive": true,
        "city": "Ankara"
    },
    {
        "id": "a6b1a2bc-319b-4bc4-bac9-0035b8194677",
        "firstName": "Victoria",
        "lastName": "Kilback",
        "dateOfBirth": "1960-08-14",
        "salary": 113962.04,
        "avatarUrl": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/712.jpg",
        "isActive": true,
        "city": "Ankara"
    }
];
`;

export const indexTSCode: string = `
import { Component, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';
import { FlexiGridModule } from 'flexi-grid';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [FlexiGridModule,FormsModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css'
})
export class IndexComponent {
  users = signal<UserModel[]>(UsersData);
  showIndex = signal<boolean>(true);
  indexWidth = signal<string>("70px");
}
`;

export const indexHTMLCode: string = `
<flexi-grid [data]="users()" [showIndex]="showIndex()" [indexWidth]="indexWidth()">
    <flexi-grid-column field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const paginationTSCode: string = `
import { Component, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FlexiGridComponent,FlexiGridColumnComponent, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  users = signal<UserModel[]>(UsersData);
  pageable = signal<boolean>(true);
  pageSize = signal<number>(10);
  pageSizeList = signal<number[]>([3,5,10,15,20,50]);
  numbers = signal<number[]>([1,2,3,4,5,10,15,20,25,30,35,40,45,50,100,150,200]);  
}
`;

export const paginationHTMLCode: string = `
<flexi-grid 
    [data]="users()" 
    [pageable]="pageable()" 
    [pageSize]="pageSize()" 
    [pageSizeList]="pageSizeList()">
    <flexi-grid-column field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const sortTSCode: string = `
import { Component, signal } from '@angular/core';
import { FlexiGridColumnComponent, FlexiGridComponent } from '../../../../../flexi-grid/src/public-api';
//import { FlexiGridModule } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-sort',
  standalone: true,
  imports: [FlexiGridComponent,FlexiGridColumnComponent, FormsModule],
  templateUrl: './sort.component.html',
  styleUrl: './sort.component.css'
})
export class SortComponent {
  users = signal<UserModel[]>(UsersData);
  sortable = signal<boolean>(true);
  idSortable = signal<boolean>(true);
  firstNameSortable = signal<boolean>(true);
  lastNameSortable = signal<boolean>(true);
  dateOfBirthSortable = signal<boolean>(true);
  salarySortable = signal<boolean>(true);
}
`;

export const sortHTMLCode: string = `
<flexi-grid 
[data]="users()"
[sortable]="sortable()"
>
    <flexi-grid-column field="id" [sortable]="idSortable()" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" [sortable]="firstNameSortable()" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" [sortable]="lastNameSortable()" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" [sortable]="dateOfBirthSortable()" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" [sortable]="salarySortable()" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const filterTSCode: string = `
import { Component, signal } from '@angular/core';
import { FlexiGridComponent,FlexiGridColumnComponent,FilterType, FlexiGridFilterDataModel } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [FlexiGridComponent,FlexiGridColumnComponent, FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css'
})
export class FilterComponent {
  users = signal<UserModel[]>(UsersData);
  filterable = signal<boolean>(true);
  idFilterable = signal<boolean>(true);
  idFilterType = signal<FilterType>("text");
  firstNameFilterable = signal<boolean>(true);
  firstNameFilterType = signal<FilterType>("text");
  lastNameFilterable = signal<boolean>(true);
  lastNameFilterType = signal<FilterType>("text");
  dateOfBirthFilterable = signal<boolean>(true);
  dateOfBirthFilterType = signal<FilterType>("date");
  salaryFilterable = signal<boolean>(true);
  salaryFilterType = signal<FilterType>("number");
  isActiveFilterable = signal<boolean>(true);
  isActiveFilterType = signal<FilterType>("boolean");
  filterTSCode = signal<string>(filterTSCode);
  filterHTMLCode = signal<string>(filterHTMLCode);
  dataCode = signal<string>(dataTSCode);
  filterData = signal<FlexiGridFilterDataModel[]>([
    {
      value: "'Kayseri'",
      name: "Kayseri"
    },
    {
      value: "'İstanbul'",
      name: "İstanbul"
    },
    {
      value: "'Ankara'",
      name: "Ankara"
    }
  ])
}
`;

export const filterHTMLCode: string = `
<flexi-grid [data]="users()" [filterable]="filterable()">
    <flexi-grid-column
      field="id"
      [filterable]="idFilterable()"
      [filterType]="idFilterType()"
      title="Id">
    </flexi-grid-column>
    <flexi-grid-column
      field="firstName"
      [filterable]="firstNameFilterable()"
      [filterType]="firstNameFilterType()"
      title="First Name">
    </flexi-grid-column>
    <flexi-grid-column
      field="lastName"
      [filterable]="lastNameFilterable()"
      [filterType]="lastNameFilterType()"
      title="Last Name">
    </flexi-grid-column>
    <flexi-grid-column
      field="dateOfBirth"
      [filterable]="dateOfBirthFilterable()"
      [filterType]="dateOfBirthFilterType()"
      filterType="date"
      format="dd.MM.yyyy"
      title="Date Of Birth"
      textAlign="center">
    </flexi-grid-column>
    <flexi-grid-column
      field="salary"
      [filterable]="salaryFilterable()"
      [filterType]="salaryFilterType()"
      filterType="number"
      format="n"
      [fraction]="2"
      title="Salary"
      textAlign="right"
      >
    </flexi-grid-column>
    <flexi-grid-column
      field="isActive"
      title="Is Active"
      [filterable]="isActiveFilterable()"
      [filterType]="isActiveFilterType()"
      [booleanData]="['Aktif', 'Pasif']"                                                            
      textAlign="center"
      [showCheckbox]="false"
      >
    </flexi-grid-column>
    <flexi-grid-column
      field="isActive"
      title="Is Active"
      [filterable]="true"
      filterType="select"
      [filterData]="filterData()"
      textAlign="center"
      [showCheckbox]="false"
      >
    </flexi-grid-column>
    <flexi-grid-column
      field="city"
      title="City"
      filterType="select"
      [filterData]="filterData()"
      textAlign="center">
    </flexi-grid-column>
</flexi-grid>
`;

export const captionTSCode: string = `
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { FlexiGridModule } from 'flexi-grid';

@Component({
  selector: 'app-caption',
  standalone: true,
  imports: [FormsModule, FlexiGridComponent, FlexiGridColumnComponent],
  templateUrl: './caption.component.html',
  styleUrl: './caption.component.css'
})
export class CaptionComponent {
  users = signal<UserModel[]>(UsersData);
  showCaption = signal<boolean>(true);
  captionTitle = signal<string>("User list");
  showColumnVisibility = signal<boolean>(true);
  columnVisibilityBtnClass = signal<string>("btn");
  showRefreshBtn = signal<boolean>(true);
  refreshDataBtnClass = signal<string>("btn");
}
`;

export const captionHTMLCode: string = `
<flexi-grid 
    [data]="users()" 
    [showCaption]="showCaption()"
    [captionTitle]="captionTitle()"
    [showColumnVisibility]="showColumnVisibility()" 
    [columnVisibilityBtnClass]="columnVisibilityBtnClass()"
    [showRefreshBtn]="showRefreshBtn()"
    [refreshDataBtnClass]="refreshDataBtnClass()"
    [captionTemplate]="captionTemplate"
    >

    <ng-template #captionTemplate>
       <flexi-button btnColor="default">
          <i class="fa-solid fa-plus me-1"></i>
          Kullanıcı ekle
       </flexi-button>
    </ng-template>

    <flexi-grid-column field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const footerTSCode: string = `
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { FlexiGridModule } from 'flexi-grid';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [FlexiGridColumnComponent, FlexiGridComponent, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  users = signal<UserModel[]>(UsersData);
}
`;

export const footerHTMLCode: string = `
<flexi-grid 
    [data]="users()"
    [footerTemplate]="footerTemplate"
    >   
    <flexi-grid-column field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" title="Salary"></flexi-grid-column>

    <ng-template #footerTemplate>
        <tr style="height: 50px;">
            <th style="padding-left: 50px;" colspan="4">Total Count</th>
            <th>{{users().length}}</th>
        </tr>
    </ng-template>
</flexi-grid>
`;

export const dataBindingTSCode: string = `
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { FlexiGridComponent,FlexiGridColumnComponent, StateModel, FlexiGridService } from 'flexi-grid';

@Component({
  selector: 'app-data-binding',
  standalone: true,
  imports: [FlexiGridColumnComponent, FlexiGridComponent, FormsModule],
  templateUrl: './data-binding.component.html',
  styleUrl: './data-binding.component.css'
})
export class DataBindingComponent {
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
  
  constructor(
    private http: HttpClient,
    private flexi: FlexiGridService
  ){
    this.getAll();
  }

  getAll(){
    this.loading.set(true);

    let oDataEndpointPart = this.flexi.getODataEndpoint(this.state());
    let endpoint = 'https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&' + oDataEndpointPart;

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
`;

export const dataBindingHTMLCode: string = `
<flexi-grid 
    [data]="users()"
    [total]="total()"
    [dataBinding]="dataBinding()"
    [loading]="loading()"
    [pageable]="pageable()"
    [pageSize]="pageSize()"
    [pageSizeList]="pageSizeList()"
    [showIndex]="showIndex()"
    [sortable]="sortable()"
    [showCaption]="showCaption()"
    [captionTitle]="captionTitle()"
    [showColumnVisibility]="showColumnVisibility()" 
    [showRefreshBtn]="showRefreshBtn()"
    [filterable]="filterable()"
    (dataStateChange)="dataStateChange($event)"
    (refreshData)="getAll()"
    >
    <flexi-grid-column field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" filterType="date" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" filterType="number" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const optionsTSCode: string = `
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { FlexiGridModule } from 'flexi-grid';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [FlexiGridColumnComponent, FlexiGridComponent, FormsModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class OptionsComponent {
  users = signal<UserModel[]>(UsersData);
  height = signal<string>("420px");
  idWidth = signal<string>("100%");
  firstNameWidth = signal<string>("100%");
  lastNameWidth = signal<string>("100%");
  dateOfBirthWidth = signal<string>("100%");
  salaryWidth = signal<string>("100%");
  visibleIdColumn = signal<boolean>(true);
  visibleFirstNameColumn = signal<boolean>(true);
  visibleLastNameColumn = signal<boolean>(true);
  visibleDateOfBirthColumn = signal<boolean>(true);
  visibleSalaryColumn = signal<boolean>(true);
  autoHeight = signal<boolean>(false);
  useMinWidth = signal<boolean>(true);
  minWidth = signal<string>("1050px");
  autoWidth = signal<boolean>(true);
  width = signal<string>("100%");
}
`;

export const optionsHTMLCode: string = `
<flexi-grid 
[data]="users()" 
[height]="height()"
[autoHeight]="autoHeight()"
[useMinWidth]="useMinWidth()"
[minWidth]="minWidth()"
[width]="width()"
[autoWidth]="autoWidth()"
footerPerPageText="items per page"        
>
    <flexi-grid-column field="id" [visible]="visibleIdColumn()" [width]="idWidth()" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" [visible]="visibleFirstNameColumn()" [width]="firstNameWidth()" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" [visible]="visibleLastNameColumn()" [width]="lastNameWidth()" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" [visible]="visibleDateOfBirthColumn()" [width]="dateOfBirthWidth()" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" [visible]="visibleSalaryColumn()" [width]="salaryWidth()" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const exportExcelTSCode: string = `
import { Component, signal } from '@angular/core';
import { FlexiGridComponent,FlexiGridColumnComponent, StateModel, FlexiGridService } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { exportExcelHTMLCode, exportExcelTSCode } from '../code';
import { FormsModule } from '@angular/forms';
import { UserModel } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-export-excel',
  standalone: true,
  imports: [FlexiGridColumnComponent, FlexiGridComponent, FormsModule, MyCodeComponent],
  templateUrl: './export-excel.component.html',
  styleUrl: './export-excel.component.css'
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
    let endpoint = 'https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&' + oDataEndpointPart;

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
}`;

export const exportExcelHTMLCode: string = `
<flexi-grid 
  [data]="users()"
  [total]="total()"
  [dataBinding]="dataBinding()"
  .
  .
  .
  [showRefreshBtn]="showRefreshBtn()"
  [showExportExcel]="true"
  exportExcelFileName="my-file"
  [exportExcelButtonClick]="exportExcel.bind(this)"            
>
  <flexi-grid-column field="id" title="Id"></flexi-grid-column>
  <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
  <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
  <flexi-grid-column field="dateOfBirth" filterType="date" title="Date Of Birth"></flexi-grid-column>
  <flexi-grid-column field="salary" filterType="number" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const customColumnTSCode: string = `
import { Component, Input, signal } from '@angular/core';
import { FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { UsersData } from '../data';
import { UserModel } from '../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-column',
  standalone: true,
  imports: [FlexiGridModule, MyCodeComponent, CommonModule],
  templateUrl: './custom-column.component.html',
  styleUrl: './custom-column.component.css'
})
export class CustomColumnComponent {
  users = signal<UserModel[]>(UsersData);

  edit(id: any){

  }

  remove(id: any){
    
  }
}
`;

export const customColumnHTMLCode: string = `
<flexi-grid 
    [data]="users()" 
    [commandColumnTemplate]="customButtonColumnTemplate" 
    [commandColumnTextAlign]="'center'" 
    [stickyCommandColumn]="true" 
    [showCommandColumn]="true">

    <flexi-grid-column field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    
    <flexi-grid-column field="salary" title="Salary">
      <!-- Eklediğiniz özel column a özel filter alanı da ekleyebiliyorsunuz -->
      <ng-template flexiGridHeaderTemplate>
        <input type="search" class="flexi-grid-filter-input" (keyup)="onKeyUp($event)" placeholder="Custom filter...">
      </ng-template> 

      <!-- let-item ile bu döngüdeki tüm datayı yakalıyoruz -->
      <ng-template flexiGridCellTemplate let-item let-rowIndex="rowIndex">
        Bu column değeri: {{item.salary}} || bu da index: {{rowIndex}}
      </ng-template>
    </flexi-grid-column>

    <ng-template #customButtonColumnTemplate let-item="item">
        <!--# ile ng-template oluşturup onu commandColumnTemplate'e verirsek command alanı columnların en sonunda gözükür. 
        Sticky yapabiliyoruz bu sayede overflow olursa kaymıyor, text-align yapabiliriz.-->
        <flexi-button (click)="edit(item.id)" btnColor="primary" [outline]="true">
          <i class="fa-solid fa-edit"></i>
        </flexi-button>
        <flexi-button (click)="remove(item.id)" class="ms-1" btnColor="danger" [outline]="true">
            <i class="fa-solid fa-trash"></i>
        </flexi-button>
    </ng-template>
</flexi-grid>
`;

export const resizableTSCode: string = `
import { Component, Input, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { resizableHTMLCode, resizableTSCode } from '../code';

@Component({
  selector: 'app-resizable',
  standalone: true,
  imports: [FlexiGridModule, MyCodeComponent],
  templateUrl: './resizable.component.html',
  styleUrl: './resizable.component.css'
})
export class ResizableComponent {
  users = signal<UserModel[]>(UsersData);
}

`;

export const resizableHTMLCode: string = `
<flexi-grid [data]="users()" [resizable]="true">
    <flexi-grid-column [resizable]="true" field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const draggableTSCode: string = `
import { Component, Input, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { resizableHTMLCode, resizableTSCode } from '../code';

@Component({
  selector: 'app-draggable',
  standalone: true,
  imports: [FlexiGridModule, MyCodeComponent],
  templateUrl: './resizable.component.html',
  styleUrl: './resizable.component.css'
})
export class DraggableComponent {
  users = signal<UserModel[]>(UsersData);
}

`;

export const draggableHTMLCode: string = `
<flexi-grid [data]="users()" [draggable]="true">
    <flexi-grid-column [draggable]="true" field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" title="Salary"></flexi-grid-column>
</flexi-grid>
`;

export const changeThemeTSCode: string = `
import { Component, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { FlexiGridModule } from 'flexi-grid';

@Component({
  selector: 'app-change-theme',
  standalone: true,
  imports: [FlexiGridModule],
  templateUrl: './change-theme.component.html',
  styleUrl: './change-theme.component.css'
})
export class ChangeThemeComponent {
  users = signal<UserModel[]>(UsersData);
  themeClass = signal<string>("light");
}
`;

export const changeThemeHTMLCode: string = `
<flexi-grid [data]="users()" [themeClass]="themeClass">
    <flexi-grid-column field="id" title="Id"></flexi-grid-column>
    <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
    <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
    <flexi-grid-column field="dateOfBirth" title="Date Of Birth"></flexi-grid-column>
    <flexi-grid-column field="salary" title="Salary"></flexi-grid-column>
</flexi-grid>
`;