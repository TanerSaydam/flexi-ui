import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexiGridColumnComponent } from './flexi-grid-column.component';
import { FlexiGridComponent } from './flexi-grid.component';



@NgModule({
  declarations: [],
  imports: [
    FlexiGridComponent,
    FlexiGridColumnComponent
  ],
  exports: [
    FlexiGridComponent,
    FlexiGridColumnComponent
  ]
})
export class FlexiGridModule { }
