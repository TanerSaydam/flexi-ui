import { ChangeDetectionStrategy, Component, computed, inject, resource, signal, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { TrCurrencyPipe } from 'tr-currency';
import { FlexiGridModule } from '../../../../../libs/flexi-grid/src/lib/modules/flexi-grid.module';
import { FlexiTooltipDirective } from '../../../../../libs/flexi-tooltip/src/lib/flexi-tooltip.directive';
import { StateModel } from '../../../../../libs/flexi-grid/src/lib/models/state.model';
import { FlexiGridService } from '../../../../../libs/flexi-grid/src/lib/services/flexi-grid.service';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FlexiGridFilterDataModel } from '../../../../../libs/flexi-grid/src/lib/models/flexi-grid-filter-data.model';


@Component({
  imports: [
    BlankComponent,
    FlexiGridModule,
    TrCurrencyPipe,
  ],
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  state = signal<StateModel>(new StateModel());
  result = resource({
    request: this.state,
    loader: async ({ request: req }) => {
      let oDataEndpointPart = this.#grid.getODataEndpoint(req);
      let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&${oDataEndpointPart}`;

      const res = await lastValueFrom(await this.#http.get<any>(endpoint));

      return res;
    }
  })
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
  users = computed(() => this.result.value()?.data ?? []);
  total = computed(() => this.result.value()?.total ?? 0);
  loading = computed(() => this.result.isLoading());
  data = signal<any[]>([
    {
      "id": 1,
      "ad": "Ahmet Yılmaz",
      "tcKimlikNo": "12345678901",
      "sgkSicilNo": "987654321",
      "brutUcret": 18000,
      "sgkPrimKesintisi": 2520,
      "issizlikSigortasiKesintisi": 180,
      "gelirVergisi": 2670,
      "damgaVergisi": 136.62,
      "netUcret": 12493.38
    },
    {
      "id": 2,
      "ad": "Mehmet Demir",
      "tcKimlikNo": "12345678902",
      "sgkSicilNo": "987654322",
      "brutUcret": 20000,
      "sgkPrimKesintisi": 2800,
      "issizlikSigortasiKesintisi": 200,
      "gelirVergisi": 3000,
      "damgaVergisi": 151.80,
      "netUcret": 13948.20
    },
    {
      "id": 3,
      "ad": "Ayşe Kaya",
      "tcKimlikNo": "12345678903",
      "sgkSicilNo": "987654323",
      "brutUcret": 22000,
      "sgkPrimKesintisi": 3080,
      "issizlikSigortasiKesintisi": 220,
      "gelirVergisi": 3330,
      "damgaVergisi": 166.98,
      "netUcret": 15403.02
    },
    {
      "id": 4,
      "ad": "Fatma Şahin",
      "tcKimlikNo": "12345678904",
      "sgkSicilNo": "987654324",
      "brutUcret": 19000,
      "sgkPrimKesintisi": 2660,
      "issizlikSigortasiKesintisi": 190,
      "gelirVergisi": 2850,
      "damgaVergisi": 144.21,
      "netUcret": 13255.79
    },
    {
      "id": 5,
      "ad": "Ali Çelik",
      "tcKimlikNo": "12345678905",
      "sgkSicilNo": "987654325",
      "brutUcret": 21000,
      "sgkPrimKesintisi": 2940,
      "issizlikSigortasiKesintisi": 210,
      "gelirVergisi": 3180,
      "damgaVergisi": 160.38,
      "netUcret": 14709.62
    },
    {
      "id": 6,
      "ad": "Emine Aydın",
      "tcKimlikNo": "12345678906",
      "sgkSicilNo": "987654326",
      "brutUcret": 17500,
      "sgkPrimKesintisi": 2450,
      "issizlikSigortasiKesintisi": 175,
      "gelirVergisi": 2625,
      "damgaVergisi": 133.82,
      "netUcret": 12116.18
    },
    {
      "id": 7,
      "ad": "Mustafa Tekin",
      "tcKimlikNo": "12345678907",
      "sgkSicilNo": "987654327",
      "brutUcret": 19500,
      "sgkPrimKesintisi": 2730,
      "issizlikSigortasiKesintisi": 195,
      "gelirVergisi": 2925,
      "damgaVergisi": 149.00,
      "netUcret": 13601.00
    },
    {
      "id": 8,
      "ad": "Hüseyin Koç",
      "tcKimlikNo": "12345678908",
      "sgkSicilNo": "987654328",
      "brutUcret": 18500,
      "sgkPrimKesintisi": 2590,
      "issizlikSigortasiKesintisi": 185,
      "gelirVergisi": 2775,
      "damgaVergisi": 141.41,
      "netUcret": 13008.59
    },
    {
      "id": 9,
      "ad": "Zeynep Yıldız",
      "tcKimlikNo": "12345678909",
      "sgkSicilNo": "987654329",
      "brutUcret": 22500,
      "sgkPrimKesintisi": 3150,
      "issizlikSigortasiKesintisi": 225,
      "gelirVergisi": 3375,
      "damgaVergisi": 170.18,
      "netUcret": 15579.82
    },
    {
      "id": 10,
      "ad": "Murat Özkan",
      "tcKimlikNo": "12345678910",
      "sgkSicilNo": "987654330",
      "brutUcret": 20500,
      "sgkPrimKesintisi": 2870,
      "issizlikSigortasiKesintisi": 205,
      "gelirVergisi": 3075,
      "damgaVergisi": 155.59,
      "netUcret": 14204.41
    },
    {
      "id": 11,
      "ad": "Selin Aksoy",
      "tcKimlikNo": "12345678911",
      "sgkSicilNo": "987654331",
      "brutUcret": 23000,
      "sgkPrimKesintisi": 3220,
      "issizlikSigortasiKesintisi": 230,
      "gelirVergisi": 3450,
      "damgaVergisi": 173.32,
      "netUcret": 15826.68
    },
    {
      "id": 12,
      "ad": "Cem Karaca",
      "tcKimlikNo": "12345678912",
      "sgkSicilNo": "987654332",
      "brutUcret": 24000,
      "sgkPrimKesintisi": 3360,
      "issizlikSigortasiKesintisi": 240,
      "gelirVergisi": 3600,
      "damgaVergisi": 180.48,
      "netUcret": 16819.52
    },
    {
      "id": 13,
      "ad": "Burak Çınar",
      "tcKimlikNo": "12345678913",
      "sgkSicilNo": "987654333",
      "brutUcret": 15000,
      "sgkPrimKesintisi": 2100,
      "issizlikSigortasiKesintisi": 150,
      "gelirVergisi": 2250,
      "damgaVergisi": 112.86,
      "netUcret": 10587.14
    },
    {
      "id": 14,
      "ad": "Gamze Öztürk",
      "tcKimlikNo": "12345678914",
      "sgkSicilNo": "987654334",
      "brutUcret": 18500,
      "sgkPrimKesintisi": 2590,
      "issizlikSigortasiKesintisi": 185,
      "gelirVergisi": 2775,
      "damgaVergisi": 141.41,
      "netUcret": 13008.59
    },
    {
      "id": 15,
      "ad": "Okan Demirtaş",
      "tcKimlikNo": "12345678915",
      "sgkSicilNo": "987654335",
      "brutUcret": 17500,
      "sgkPrimKesintisi": 2450,
      "issizlikSigortasiKesintisi": 175,
      "gelirVergisi": 2625,
      "damgaVergisi": 133.82,
      "netUcret": 12116.18
    },
    {
      "id": 16,
      "ad": "Deniz Korkmaz",
      "tcKimlikNo": "12345678916",
      "sgkSicilNo": "987654336",
      "brutUcret": 19500,
      "sgkPrimKesintisi": 2730,
      "issizlikSigortasiKesintisi": 195,
      "gelirVergisi": 2925,
      "damgaVergisi": 149.00,
      "netUcret": 13601.00
    },
    {
      "id": 17,
      "ad": "Sibel Kurt",
      "tcKimlikNo": "12345678917",
      "sgkSicilNo": "987654337",
      "brutUcret": 21000,
      "sgkPrimKesintisi": 2940,
      "issizlikSigortasiKesintisi": 210,
      "gelirVergisi": 3180,
      "damgaVergisi": 160.38,
      "netUcret": 14709.62
    },
    {
      "id": 18,
      "ad": "Tolga Şimşek",
      "tcKimlikNo": "12345678918",
      "sgkSicilNo": "987654338",
      "brutUcret": 20000,
      "sgkPrimKesintisi": 2800,
      "issizlikSigortasiKesintisi": 200,
      "gelirVergisi": 3000,
      "damgaVergisi": 151.80,
      "netUcret": 13948.20
    },
    {
      "id": 19,
      "ad": "Cansu Yılmaz",
      "tcKimlikNo": "12345678919",
      "sgkSicilNo": "987654339",
      "brutUcret": 22000,
      "sgkPrimKesintisi": 3080,
      "issizlikSigortasiKesintisi": 220,
      "gelirVergisi": 3330,
      "damgaVergisi": 166.98,
      "netUcret": 15403.02
    },
    {
      "id": 20,
      "ad": "Efe Aslan",
      "tcKimlikNo": "12345678920",
      "sgkSicilNo": "987654340",
      "brutUcret": 22500,
      "sgkPrimKesintisi": 3150,
      "issizlikSigortasiKesintisi": 225,
      "gelirVergisi": 3375,
      "damgaVergisi": 170.18,
      "netUcret": 15579.82
    }
  ]);

  #grid = inject(FlexiGridService);
  #http = inject(HttpClient);

  getColumnList(event: any) {
    console.log(event);
  }

  getBrutToplam(data: any[]) {
    const bruts = data.map(m => m.brutUcret);
    let total = 0;
    bruts.forEach(val => total += val);

    return total;
  }

  getGenelToplam() {
    const bruts = this.data().map(m => m.brutUcret);
    let total = 0;
    bruts.forEach(val => total += val);

    return total;
  }

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
}