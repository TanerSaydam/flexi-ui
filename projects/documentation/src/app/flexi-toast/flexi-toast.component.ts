import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { CardComponent } from '../blank/card/card.component';
import { BlankComponent } from '../blank/blank.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-flexi-toast',
    imports: [
        BlankComponent,
        CardComponent,
        CommonModule,
        FormsModule,        
    ],
    templateUrl: './flexi-toast.component.html',
    styleUrl: './flexi-toast.component.css'
})
export default class FlexiToastComponent {    
  
  
}
