import { NgModule } from '@angular/core';
import { FlexiSelectComponent } from './flexi-select.component';
import { FlexiOptionComponent } from './flexi-option.component';
import { TranslocoModule } from '@jsverse/transloco';



@NgModule({
  declarations: [],
  imports: [
    FlexiSelectComponent,
    FlexiOptionComponent,
  ],
  exports: [
    FlexiSelectComponent,
    FlexiOptionComponent
  ]
})
export class FlexiSelectModule { }
