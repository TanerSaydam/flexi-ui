import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrCurrencyPipe } from 'tr-currency';
import { FlexiGridCellTemplateDirective } from '../directives/flexi-grid-cell-template.directive';
import { FlexiGridHeaderTemplateDirective } from '../directives/flexi-grid-header-template.directive';
import { FlexiGridComponent } from '../components/flexi-grid.component';
import { FlexiGridColumnComponent } from '../components/flexi-grid-column.component';

@NgModule({
  declarations: [
    FlexiGridComponent,
    FlexiGridColumnComponent,
    FlexiGridCellTemplateDirective,
    FlexiGridHeaderTemplateDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    TrCurrencyPipe
  ],
  exports: [
    FlexiGridComponent,
    FlexiGridColumnComponent,
    FlexiGridCellTemplateDirective,
    FlexiGridHeaderTemplateDirective
  ]
})
export class FlexiGridModule { }
