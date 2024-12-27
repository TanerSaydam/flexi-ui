import { Component, ViewEncapsulation, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import {dataTSCode} from './code';
import FullComponent from './full/full.component';
import { LoadingComponent } from '../loading/loading.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-flexi-grid',
    imports: [
        BlankComponent,
        CardComponent,
        CommonModule,
        FullComponent,        
        LoadingComponent,
        TranslocoModule
    ],
    templateUrl: './flexi-grid.component.html',
    styleUrl: './flexi-grid.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class FlexiDataGridComponent {  
  dataCode = signal<string>(dataTSCode);
}
