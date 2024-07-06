import { NgModule } from '@angular/core';
import { FlexiGridColumnComponent } from './flexi-grid-column.component';
import { FlexiGridComponent } from './flexi-grid.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrCurrencyPipe } from 'tr-currency';

@NgModule({
  declarations: [
    FlexiGridComponent,
    FlexiGridColumnComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TrCurrencyPipe
  ],
  exports: [
    FlexiGridComponent,
    FlexiGridColumnComponent
  ]
})
export class FlexiGridModule { }
