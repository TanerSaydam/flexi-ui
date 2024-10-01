import { NgModule } from '@angular/core';
import { FlexiGridColumnComponent } from './flexi-grid/flexi-grid-column.component';
import { FlexiGridComponent } from './flexi-grid/flexi-grid.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrCurrencyPipe } from 'tr-currency';
import { FlexiBtnComponent } from './flexi-button/flexi-button.component';
import { FlexiGridCellTemplateDirective } from './flexi-grid/directives/flexi-grid-cell-template.directive';

@NgModule({
  declarations: [
    FlexiGridComponent,
    FlexiGridColumnComponent,
    FlexiBtnComponent,
    FlexiGridCellTemplateDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    TrCurrencyPipe
  ],
  exports: [
    FlexiGridComponent,
    FlexiGridColumnComponent,
    FlexiBtnComponent,
    FlexiGridCellTemplateDirective
  ]
})
export class FlexiGridModule { }
