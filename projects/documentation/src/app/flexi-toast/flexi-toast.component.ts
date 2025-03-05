import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { CardComponent } from '../blank/card/card.component';
import { BlankComponent } from '../blank/blank.component';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-flexi-toast',
    imports: [
        BlankComponent,
        CardComponent,
        CommonModule,
        FormsModule,        
        TranslocoModule
    ],
    templateUrl: './flexi-toast.component.html',
    styleUrl: './flexi-toast.component.css'
})
export default class FlexiToastComponent {    
  
  
}
