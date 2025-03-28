import { Component } from '@angular/core';
import { FlexiSelectModule } from 'flexi-select';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { CommonModule } from '@angular/common';
import SelectFullComponent from './full/full.component'
import { LoadingComponent } from '../loading/loading.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-flexi-select',
    imports: [
        BlankComponent,
        CardComponent,
        CommonModule,
        FlexiSelectModule,
        SelectFullComponent,
        LoadingComponent,        
        TranslocoModule
    ],
    templateUrl: './flexi-select.component.html',
    styleUrl: './flexi-select.component.css'
})
export default class FlexiSelectComponent{
 
}
