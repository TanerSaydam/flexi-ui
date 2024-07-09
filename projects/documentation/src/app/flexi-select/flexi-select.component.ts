import { Component, signal } from '@angular/core';
import { FlexiSelectModule } from 'flexi-select';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { CommonModule } from '@angular/common';
import FullComponent from './full/full.component'
import { LoadingComponent } from '../loading/loading.component';
import { FirstUseComponent } from './first-use/first-use.component';
import { MyCodeComponent } from '../my-code/my-code.component';
import { customOptionHTMLCode, firstUseHTMLCode } from './code';
import { dataTSCode } from '../flexi-data-grid/code';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from '../shared.service';
import { CustomOptionComponent } from './custom-option/custom-option.component';
import { MultipleComponent } from './multiple/multiple.component';

@Component({
  selector: 'app-flexi-select',
  standalone: true,
  imports: [
    BlankComponent, 
    CardComponent, 
    CommonModule, 
    FlexiSelectModule,
    FullComponent,
    LoadingComponent,
    FirstUseComponent,
    MyCodeComponent,
    CustomOptionComponent,
    MultipleComponent
  ],
  templateUrl: './flexi-select.component.html',
  styleUrl: './flexi-select.component.css'
})
export class FlexiSelectComponent {
  dataCode = signal<string>(dataTSCode);
  firstUseTSCodeExample1 = signal<string>(`import { FlexiSelectComponent,FlexiOptionColumnComponent } from 'flexi-select';

    @Component({
    ..
    imports: [FlexiSelectComponent, FlexiOptionColumnComponent]
    })
    `);
  firstUseTSCodeExample2 = signal<string>(`import { FlexiSelectModule } from 'flexi-select';

    @Component({
    ..
    imports: [FlexiSelectModule]
    })
    `);
  firstUseHTMLCodeExample = signal<string>(firstUseHTMLCode);
  customOptionHTMLCodeExample = signal<string>(customOptionHTMLCode);
  multipleHTMLCodeExample = signal<string>(`<flexi-select
  ...
  [multiple]="true"
  [closeAfterSelect]="false"    
  height="100%"
  >
  </flexi-select>`);
  
  constructor(
    private route: ActivatedRoute, 
    private shared: SharedService
  ) { 
    this.shared.openOrCloseFlexiSelectDropDown.set(true);
  }

  ngOnDestroy(): void {
    this.shared.openOrCloseFlexiSelectDropDown.set(false);
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
