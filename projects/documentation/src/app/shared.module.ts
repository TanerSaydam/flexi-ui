import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlankComponent } from './blank/blank.component';
import { CardComponent } from './blank/card/card.component';
import { LoadingComponent } from './loading/loading.component';
import { MyCodeComponent } from './my-code/my-code.component';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';



@NgModule({
  declarations: [],
  imports: [    
    BlankComponent, 
    CardComponent, 
    CommonModule, 
    LoadingComponent,
    MyCodeComponent,
    FormsModule,
    TranslocoModule
  ],
  exports: [
    BlankComponent, 
    CardComponent, 
    CommonModule, 
    LoadingComponent,
    MyCodeComponent,
    FormsModule,
    TranslocoModule
  ]
})
export class SharedModule { }
