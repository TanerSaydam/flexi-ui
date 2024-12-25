import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { UsersData } from '../../../../documentation/src/app/flexi-grid/data';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/modules/flexi-grid.module';

@Component({
    imports: [    
    BlankComponent,
    FlexiGridModule    
],
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  data = signal<any[]>(UsersData);
  loading = signal<boolean>(false);
}