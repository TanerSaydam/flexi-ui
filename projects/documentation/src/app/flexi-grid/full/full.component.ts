import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FlexiGridModule, StateModel, FlexiGridService, FlexiGridFilterDataModel } from 'flexi-grid';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { fullExampleHTMLCode, fullExampleTSCode } from '../code';
import { SharedService } from '../../shared.service';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { lastValueFrom } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { TrCurrencyPipe } from 'tr-currency';

@Component({
    selector: 'app-flexi-grid-full',
    imports: [FlexiGridModule, MyCodeComponent, FlexiTooltipDirective, TranslocoDirective, TrCurrencyPipe],
    templateUrl: './full.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export default class FullComponent {
  state = signal<StateModel>(new StateModel());
  result = resource({
    request: () => this.state(),
    loader: async ({request: req})=> {
      let oDataEndpointPart = this.#grid.getODataEndpoint(this.state());
      let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&${oDataEndpointPart}`;

      const res = await lastValueFrom(await this.#http.get<any>(endpoint));

      return res;
    }
  })
  users = computed(() => this.result.value()?.data ?? []);
  total = computed(() => this.result.value()?.total ?? 0);
  loading = computed(() => this.result.isLoading());

  totalResult = resource({
    loader: async ()=> {
      let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$apply=aggregate(salary with average as averageSalary)`;

      const res = await lastValueFrom(this.#http.get<any>(endpoint));
      return res;
    }
  });
  averageSalary = computed(() => this.totalResult.value()?.data[0].averageSalary ?? 0);

  fullExampleTSCode = signal<string>(fullExampleTSCode);
  fullExampleHTMLCode =signal<string>(fullExampleHTMLCode);
  filterData = signal<FlexiGridFilterDataModel[]>([
    {
      value: "Kayseri",
      name: "Kayseri"
    },
    {
      value: "İstanbul",
      name: "İstanbul"
    },
    {
      value: "Ankara",
      name: "Ankara"
    }
  ]);

  #grid = inject(FlexiGridService);
  #http = inject(HttpClient);
  shared = inject(SharedService);

  dataStateChange(event:any){
    this.state.set(event);
    console.log(event);
  }

  exportExcel(){
    this.#http.get("https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll").subscribe((res:any)=> {
      this.#grid.exportDataToExcel(res.data, "my-excel");
    })
  }

  deleteByItem(item: any){
  }

  calculatePageAverageSalary(data:any[]){
    const salaries = data.map(val => val.salary);
    const totalSalary = salaries.reduce((sum, salary) => sum + salary, 0);
    return salaries.length ? totalSalary / salaries.length : 0;
  }
}
