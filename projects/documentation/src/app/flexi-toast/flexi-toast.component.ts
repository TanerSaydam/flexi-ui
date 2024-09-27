import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { CardComponent } from '../blank/card/card.component';
import { BlankComponent } from '../blank/blank.component';
import { FlexiToastOptionsModel, FlexiToastService } from 'flexi-toast';
import { FormsModule } from '@angular/forms';
import { MyCodeComponent } from '../my-code/my-code.component';

@Component({
  selector: 'app-flexi-toast',
  standalone: true,
  imports: [
    BlankComponent, 
    CardComponent, 
    CommonModule,
    FormsModule,
    MyCodeComponent
  ],
  templateUrl: './flexi-toast.component.html',
  styleUrl: './flexi-toast.component.css'
})
export default class FlexiToastComponent {    
  
  
}
