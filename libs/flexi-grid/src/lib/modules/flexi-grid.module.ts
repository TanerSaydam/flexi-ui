import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrCurrencyPipe } from 'tr-currency';
import { FlexiGridCellTemplateDirective } from '../directives/flexi-grid-cell-template.directive';
import { FlexiGridHeaderTemplateDirective } from '../directives/flexi-grid-header-template.directive';
import { FlexiGridComponent } from '../components/flexi-grid.component';
import { FlexiGridColumnComponent } from '../components/flexi-grid-column.component';
import { FlexiButtonComponent } from 'flexi-button';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlexiGridFooterTemplateDirective } from '../directives/flexi-grid-footer-template.directive';

@NgModule({
  declarations: [
    FlexiGridComponent,
    FlexiGridColumnComponent,
    FlexiGridCellTemplateDirective,
    FlexiGridHeaderTemplateDirective,
    FlexiGridFooterTemplateDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    TrCurrencyPipe,
    FlexiTooltipDirective,
    FlexiButtonComponent,
    DragDropModule
    ],
  exports: [
    FlexiGridComponent,
    FlexiGridColumnComponent,
    FlexiGridCellTemplateDirective,
    FlexiGridHeaderTemplateDirective,
    FlexiTooltipDirective,
    DragDropModule,
    FlexiButtonComponent,
    FlexiGridFooterTemplateDirective
  ]
})
export class FlexiGridModule { }
