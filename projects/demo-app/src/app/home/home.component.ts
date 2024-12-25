import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/modules/flexi-grid.module';
import { HttpClient } from '@angular/common/http';
import { StateModel } from '../../../../flexi-grid/src/lib/models/state.model';
import { FlexiGridService } from '../../../../flexi-grid/src/lib/services/flexi-grid.service';

@Component({
    imports: [    
    BlankComponent,
    FlexiGridModule    
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

  #http = inject(HttpClient);
  #grid = inject(FlexiGridService);

  constructor(){
    this.getAll();
  }

  getAll(){
    let endpoint = "https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&";
    let oDataEndpoint = this.#grid.getODataEndpoint(this.state());
    endpoint += oDataEndpoint;    
    this.#http.get<any>(endpoint).subscribe(res => {
      this.data.set(res.data!);
      this.total.set(res.total);
    })
  }

  dataStateChange(state: StateModel){
    this.state.set(state);
    this.getAll();
  }
}