import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { MyCodeComponent } from '../my-code/my-code.component';
import {firstUseTSCode, firstUseHTMLCode, dataTSCode, fullExampleTSCode, fullExampleHTMLCode, paginationTSCode,paginationHTMLCode, indexTSCode, indexHTMLCode, sortTSCode, sortHTMLCode, filterTSCode, filterHTMLCode, captionTSCode, captionHTMLCode, footerHTMLCode, footerTSCode, dataBindingTSCode, dataBindingHTMLCode, optionsTSCode, optionsHTMLCode} from './code'
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
import { ActivatedRoute, Router } from '@angular/router';
import { SharedService } from '../shared.service';
import { LoadingComponent } from '../loading/loading.component';
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
    LoadingComponent
  ],
  templateUrl: './flexi-data-grid.component.html',
  styleUrl: './flexi-data-grid.component.css'
})
export class FlexiDataGridComponent implements OnDestroy {
  fullExampleTSCode = signal<string>(fullExampleTSCode);
  fullExampleHTMLCode =signal<string>(fullExampleHTMLCode);
  firstUseTSCode = signal<string>(firstUseTSCode);
  firstUseHTMLCode = signal<string>(firstUseHTMLCode);
  dataCode = signal<string>(dataTSCode);
  paginationTSCode = signal<string>(paginationTSCode);
  paginationHTMLCode = signal<string>(paginationHTMLCode);
  indexTSCode = signal<string>(indexTSCode);
  indexHTMLCode = signal<string>(indexHTMLCode);
  sortTSCode = signal<string>(sortTSCode);
  sortHTMLCode = signal<string>(sortHTMLCode);
  filterTSCode = signal<string>(filterTSCode);
  filterHTMLCode = signal<string>(filterHTMLCode);
  captionTSCode = signal<string>(captionTSCode);
  captionHTMLCode = signal<string>(captionHTMLCode);
  footerTSCode = signal<string>(footerTSCode);
  footerHTMLCode = signal<string>(footerHTMLCode);
  dataBindingTSCode = signal<string>(dataBindingTSCode);
  dataBindingHTMLCode = signal<string>(dataBindingHTMLCode);
  optionsTSCode = signal<string>(optionsTSCode);
  optionsHTMLCode = signal<string>(optionsHTMLCode);  

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
