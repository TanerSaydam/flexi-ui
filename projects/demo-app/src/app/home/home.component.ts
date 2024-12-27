import { ChangeDetectionStrategy, Component, inject, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/modules/flexi-grid.module';
import { HttpClient } from '@angular/common/http';
import { StateModel } from '../../../../flexi-grid/src/lib/models/state.model';
import { FlexiGridService } from '../../../../flexi-grid/src/lib/services/flexi-grid.service';
import { FormsModule } from '@angular/forms';
import { FlexiGridComponent } from '../../../../flexi-grid/src/lib/components/flexi-grid.component';

@Component({
    imports: [    
    BlankComponent,
    FlexiGridModule,
    FormsModule    
],
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  data = signal<any[]>([]);
  total = signal<number>(0);
  loading = signal<boolean>(false);
  state = signal<StateModel>(new StateModel());
  fullName = signal<string>("");

  readonly flexiGrid = viewChild<FlexiGridComponent>("grid");

  #http = inject(HttpClient);
  #grid = inject(FlexiGridService);

  constructor(){
    this.getAll();
  }

  getAll(){
    this.loading.set(true);
    let endpoint = "https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&";
    let oDataEndpoint = this.#grid.getODataEndpoint(this.state());
    endpoint += oDataEndpoint;    
    this.#http.get<any>(endpoint).subscribe(res => {
      this.data.set(res.data!);
      this.total.set(res.total);
      this.loading.set(false);
    },()=> this.loading.set(false))
  }

  exprtExcel(){
    let endpoint = "https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&";
    this.#http.get<any>(endpoint).subscribe(res => {
      const data= res.data;
      this.#grid.exportDataToExcel(data,"user-list");
    },()=> this.loading.set(false))
  }

  getFullNameChange(){
    console.log(this.fullName());
    
  }

  dataStateChange(state: StateModel){
    this.state.set(state);
    this.getAll();
  }

  selected(event:any[]){
    console.log(event);    
  }

  clearSelection(){
    this.flexiGrid()?.clearSelected();    
  }
}