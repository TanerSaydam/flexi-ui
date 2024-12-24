import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiButtonComponent } from '../../../../flexi-button/src/lib/flexi-button.component';
import { UsersData } from '../../../../documentation/src/app/flexi-grid/data';

@Component({
    imports: [    
    BlankComponent,
    FlexiButtonComponent    
],
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  data = signal<any[]>(UsersData);
}