import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserModel } from '../../models/user.model';
import { FlexiGridModule, StateModel, FlexiGridService, FlexiGridFilterDataModel } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { fullExampleHTMLCode, fullExampleTSCode } from '../code';
import { SharedService } from '../../shared.service';
import { FlexiToastService } from 'flexi-toast';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { FlexiButtonComponent } from 'flexi-button';

@Component({
    selector: 'app-flexi-grid-full',
    imports: [FlexiGridModule, MyCodeComponent, FlexiTooltipDirective],
    templateUrl: './full.component.html',    
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export default class FullComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);  
  fullExampleTSCode = signal<string>(fullExampleTSCode);
  fullExampleHTMLCode =signal<string>(fullExampleHTMLCode);  
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
    private flexi: FlexiGridService,
    public shared: SharedService,
    private toast: FlexiToastService
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

  deleteByItem(item: any){
    this.toast.showSwal("Kaydı Sil?","Kaydı silmek istiyor musunuz?<br>(Test mesajıdır, gerçekte kaydı silmez!)",()=> {
      this.toast.showToast("Başarılı","Kayıt başarıyla silindi","info");
    })
  }
}
