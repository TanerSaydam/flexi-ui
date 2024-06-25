import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserModel } from '../models/user.model';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { FlexiGridColumnComponent, FlexiGridComponent,StateModel,FlexiGridService } from '../../../../flexi-grid/src/public-api';
//import { FlexiGridComponent,FlexiGridColumnComponent, StateModel, FlexiGridService } from 'flexi-grid';
declare var Prism: any;
import 'prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-powershell';
import { MyCodeComponent } from '../my-code/my-code.component';
import {firstUseTSCode, firstUseHTMLCode, dataTSCode, fullExampleTSCode, fullExampleHTMLCode, paginationTSCode,paginationHTMLCode, indexTSCode, indexHTMLCode} from './code'
import { FirstUseComponent } from './first-use/first-use.component';
import { PaginationComponent } from './pagination/pagination.component';
import { IndexComponent } from './index/index.component';
@Component({
  selector: 'app-flexi-data-grid',
  standalone: true,
  imports: [
    BlankComponent, 
    CardComponent, 
    FlexiGridComponent, 
    FlexiGridColumnComponent, 
    CommonModule, 
    MyCodeComponent,
    FirstUseComponent,
    IndexComponent,
    PaginationComponent
  ],
  templateUrl: './flexi-data-grid.component.html',
  styleUrl: './flexi-data-grid.component.css'
})
export class FlexiDataGridComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);  
  fullExampleTSCode = signal<string>(fullExampleTSCode);
  fullExampleHTMLCode =signal<string>(fullExampleHTMLCode);
  firstUseTSCode = signal<string>(firstUseTSCode);
  firstUseHTMLCode = signal<string>(firstUseHTMLCode);
  dataCode = signal<string>(dataTSCode);
  paginationTSCode = signal<string>(paginationTSCode);
  paginationHTMLCode = signal<string>(paginationHTMLCode);
  indexTSCode = signal<string>(indexTSCode);
  indexHTMLCode = signal<string>(indexHTMLCode);

  constructor(
    private http: HttpClient,
    private flexi: FlexiGridService
  ){
    this.getAll();
  }

  ngAfterViewInit() {
    Prism.highlightAll()
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
