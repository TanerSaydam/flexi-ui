import { Component, inject, OnInit, signal } from '@angular/core';
import { FlexiSelectModule } from 'flexi-select';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { CommonModule } from '@angular/common';
import FullComponent from './full/full.component'
import { LoadingComponent } from '../loading/loading.component';
import { MyCodeComponent } from '../my-code/my-code.component';

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
    MyCodeComponent,
  ],
  templateUrl: './flexi-select.component.html',
  styleUrl: './flexi-select.component.css'
})
export default class FlexiSelectComponent{
 
}
