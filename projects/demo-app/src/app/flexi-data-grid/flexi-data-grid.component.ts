import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { MyCodeComponent } from '../my-code/my-code.component';
import {dataTSCode, firstUseHTMLCode} from './code'
import { FirstUseComponent } from './first-use/first-use.component';
import { PaginationComponent } from './pagination/pagination.component';
import { IndexComponent } from './index/index.component';
import { SortComponent } from './sort/sort.component';
import { FilterComponent } from './filter/filter.component';
import { CaptionComponent } from './caption/caption.component';
import { FooterComponent } from './footer/footer.component';
import { DataBindingComponent } from './data-binding/data-binding.component';
import { OptionsComponent } from './options/options.component';
import { FullComponent } from './full/full.component';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from '../shared.service';
import { LoadingComponent } from '../loading/loading.component';
import { ExportExcelComponent } from './export-excel/export-excel.component';
import { CustomColumnComponent } from './custom-column/custom-column.component';

@Component({
  selector: 'app-flexi-data-grid',
  standalone: true,
  imports: [
    BlankComponent, 
    CardComponent, 
    CommonModule, 
    FullComponent,
    MyCodeComponent,
    FirstUseComponent,
    IndexComponent,
    PaginationComponent,
    SortComponent,
    FilterComponent,
    CaptionComponent,
    FooterComponent,
    DataBindingComponent,
    OptionsComponent,
    LoadingComponent,
    ExportExcelComponent,
    CustomColumnComponent
  ],
  templateUrl: './flexi-data-grid.component.html',
  styleUrl: './flexi-data-grid.component.css'
})
export class FlexiDataGridComponent implements OnDestroy {  
  dataCode = signal<string>(dataTSCode);
  firstUseTSCodeExample = signal<string>(`import { FlexiGridComponent,FlexiGridColumnComponent } from 'flexi-grid';

  @Component({
  ..
  imports: [FlexiGridComponent, FlexiGridColumnComponent]
  })
  `);
  firstUseHTMLCodeExample = signal<string>(firstUseHTMLCode);
  indexCodeExample= signal<string>(`<flexi-grid
  .
  .
  [showIndex]="true"
  indexWidth="70px" <!--  İsteğe bağlı değiştirebilirsiniz. Default değeri 70px -->
  >
  `);
  paginationCodeExample= signal<string>(`<flexi-grid
    .
    .
    [pageable]="true"
    [pageSize]="10" <!--  İsteğe bağlı değiştirebilirsiniz. Default değeri 10 -->
    >
  `);
  sortCodeExample= signal<string>(`<flexi-grid
    .
    .
    [sortable]="true"
    >

    <!-- İsterseniz column bazlı sort özelliğini kapatabilirsiniz -->
    <flexi-grid-column field="id" [sortable]="false" title="Id"></flexi-grid-column>
  `);
  filterCodeExample= signal<string>(`<flexi-grid
    .
    .
    [showCaption]="true"
    captionTitle="User List"
    >
  `);
  captionCodeExample= signal<string>(`<flexi-grid
    .
    .
    [filterable]="true"
    [showColumnVisibility]="true" <!-- Columnlarınızı gizleyip açabilmeniz için kullanabileceğiniz button -->
    [showRefreshData]="true" <!-- Verilerinizi yenilemek için kullanabileceğiniz button -->
    [captionTemplate]="captionTemplate"  <!-- Yukarıdaki butonların yanına yeni elementler ekleyebilirsiniz -->
    >
    
    <!-- İsterseniz ek elmentler ekleyebiliyorsunuz. Buraya ekledikleriniz grid captionın sağ tarafında görünür -->
    <ng-template #captionTemplate>
      <button class="btn">
        <i class="fa-solid fa-plus me-1"></i>
          Kullanıcı ekle
      </button>
    </ng-template>
  `);
  exportExcelCodeExample1 = signal<string>(`<flexi-grid
    .
    .
    [showExportExcel]="true"
    exportExcelFileName="my-file" <!--  Export dosyalarınızın adı -->
    [exportExcelButtonClick]="exportExcel.bind(this)" <!-- Eğer default export şeklini kullanmak istemezseniz bu seçenek ile metodu kendiniz yönetebilirsiniz -->
    >
  `);
  exportExcelCodeExample2= signal<string>(`
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
  customColumnCodeExample= signal<string>(`
  <!-- Öncelikle custom column yerleştireceğimiz yere böyle bir işaretleyici koyuyoruz -->
  <flexi-grid-column field="salary" title="Salary" [columnTemplate]="customSalaryColumnTemplate"></flexi-grid-column>

  <!-- Eğer datadan gelen döngüdeki herhangi bir column değerini spesifik olarak istemiyorsak field vermemize gerek yok. Item ile hepsini alabiliyoruz -->
  <flexi-grid-column title="Actions" [columnTemplate]="customButtonColumnTemplate"></flexi-grid-column>

  <!-- let-salary="value" ile value değerindeki bu döngüde gelen salary field değerini yakalıyoruz -->
  <!-- let-item="item" ile bu döngüdeki tüm datayı yakalıyoruz -->
  <ng-template #customSalaryColumnTemplate let-salary="value" let-item="item">
    <!--{{ salary }}Bu direkt işaretlediğimiz column da field değerine karşılık değeri alır-->
    {{ item.salary | currency: '': '' }} <!--Bu o döngüdeki tüm datayı alır. İçerisinden istediğiniz field a erişebilirsiniz-->
  </ng-template>

  <ng-template #customButtonColumnTemplate let-item="item">
    <button (click)="edit(item.id)" class="btn btn-outline-info">
      <i class="fa-solid fa-edit"></i>
    </button>
    <button (click)="remove(item.id)" class="btn btn-outline-danger ms-1">
      <i class="fa-solid fa-trash"></i>
    </button>
  </ng-template>
  `);
  footerCodeExample =signal<string>(`<flexi-grid 
    ..
    [footerTemplate]="footerTemplate"
    >   
    ...

    <ng-template #footerTemplate>
        <tr style="height: 50px;">
            <th style="padding-left: 50px;" colspan="4">Total Count</th>
            <th>{{users().length}}</th>
        </tr>
    </ng-template>
  </flexi-grid>
  `);
    
  constructor(
    private route: ActivatedRoute, 
    private shared: SharedService
  ) { 
    this.shared.openOrCloseFlexiGridDropDown.set(true);
  }

  ngOnDestroy(): void {
    this.shared.openOrCloseFlexiGridDropDown.set(false);
  }

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      this.scrollToElement(fragment);
    });
  }

  scrollToElement(fragment: string | null): void {
    if (fragment) {
      const element = document.getElementById(fragment);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
