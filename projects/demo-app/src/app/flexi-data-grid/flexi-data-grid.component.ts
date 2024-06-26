import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { MyCodeComponent } from '../my-code/my-code.component';
import {dataTSCode} from './code'
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
  dataCode = signal<string>(dataTSCode);      

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
