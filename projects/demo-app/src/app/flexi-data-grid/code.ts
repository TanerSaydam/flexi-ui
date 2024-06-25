export const  tsCode: string = `
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserModel } from '../models/user.model';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
//import { FlexiGridColumnComponent, FlexiGridComponent,StateModel,FlexiGridService } from '../../../../flexi-grid/src/public-api';
import { FlexiGridComponent,FlexiGridColumnComponent, StateModel, FlexiGridService } from 'flexi-grid';
import * as Prism from 'prismjs';

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
  }

  ngAfterViewInit() {
    Prism.highlightAll();
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
}`;

export const htmlCode: string = `
<app-blank pageName="Flexi Grid" pageDescription="Angular Flexi Data Grid">
    <app-card cardTitle="Örnek Çıktısı">
        <p>Angular uygulamalarınızda kullanabileceğiniz şık ve kullanışlı bir Data Grid. OData yapısıyla uyumlu, isterseniz Data binding ile kullanabileceğiniz, ister tüm datanızı alıp burada işleyebileceğiniz oldukça kullanışlı bir Data grid.</p>
        <p>Örnek çıktısı aşağıdadır. Kodlarına <a href="https://github.com/TanerSaydam/flexi-ui/blob/main/projects/demo-app/src/app/flexi-data-grid/flexi-data-grid.component.html" target="_blank">buraya tıklayarak</a> ulaşabilirsiniz.</p>

        <div class="card-body">
          <div class="tab-content">
            <div class="tab-pane active show" id="tabs-example-1">
              <h4>Örnek Görüntüsü</h4>
              <flexi-grid
              [data]="users()"
              [total]="total()"
              [dataBinding]="true"
              [pagable]="true"
              [pageSize]="state().pageSize"
              [pageSizeList]="[10,20,30,50,100,1000]"
              [showIndex]="true"
              [loading]="loading()"
              themeClass="light"
              [height]="420"
              [filterable]="true"
              tableTitle="Example User Table"
              [captionTemplate]="captionTemplate"
              [footerTemplate]="footerTemplate"
              [showCaption]="true"
              (refreshData)="getAll()"
              (dataStateChange)="dataStateChange($event)"
              >            
                <flexi-grid-column [visible]="false" field="id" title="Id" [orderable]="false"></flexi-grid-column>
                <!-- <flex-grid-column field="avatarUrl" title="Avatar"></flex-grid-column> -->
                <flexi-grid-column field="firstName" title="First Name"></flexi-grid-column>
                <flexi-grid-column field="lastName" title="Last Name"></flexi-grid-column>
                <flexi-grid-column field="dateOfBirth" [filterType]="'date'" format="dd.MM.yyyy" title="Date Of Birth"></flexi-grid-column>
                <flexi-grid-column field="salary" format="n2" filterType="number" title="Salary"></flexi-grid-column>
                <!-- <flex-grid-column field="salary" [columnTempalte]="salaryTemplate" filterType="number" title="Salary"></flex-grid-column> -->
                <!-- <ng-template #salaryTemplate let-value="value">
                  <span>{{value | currency}}</span>
                </ng-template> -->
    
                <ng-template #footerTemplate>
                  <!-- <tr>
                    <td colspan="5">Total</td>
                    <td>46546</td>
                  </tr> -->
                </ng-template>
    
                <ng-template #captionTemplate>
                  <!-- <button>Kullanıcı ekle</button> -->
                </ng-template>
             
                
              </flexi-grid>
            </div>
          </div>
        </div>  
    </app-card>
</app-blank>
`