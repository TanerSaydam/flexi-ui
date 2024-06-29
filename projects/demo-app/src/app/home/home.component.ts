import { Component, signal } from '@angular/core';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/flexi-grid.module';
import { StateModel } from '../../../../flexi-grid/src/lib/state.model';
import { FlexiGridService } from '../../../../flexi-grid/src/lib/flexi-grid.service';
import { BlankComponent } from '../blank/blank.component';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../shared.service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BlankComponent,FlexiGridModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  result = signal({data:[], total:0});
  loading = signal<boolean>(false);
  state = signal<StateModel>(new StateModel());
  constructor(
    private http: HttpClient,
    public shared: SharedService,
    private flexi: FlexiGridService
  ){
    this.getAll()
  }

  getAll(){
    const odataEndPoint = this.flexi.getODataEndpoint(this.state());
    //let enpoint = `https://localhost:7010/api/Home/GetAllProductOData?$count=true&${odataEndPoint}`;
    let enpoint = `https://localhost:7010/api/Home/GetAllProductOData`;
    const data = {
      companyId: "7bf563da-5166-40ba-a861-1bc548a1a609"
    }

    this.loading.set(true);
    this.http.post(enpoint, data).subscribe({
      next: (res: any)=> {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err: any)=> {
        console.log(err);    
        this.loading.set(false);    
      }
    })
  }

  dataStateChange(event:any){
    this.state.set(event);
    this.getAll();
  }
}
