import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FlexiPopupModule } from '../../../../flexi-popup/src/lib/flexi-popup.module';


@Component({
    imports: [    
    BlankComponent,
    FlexiPopupModule,
    FormsModule,
    CommonModule
],
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  detailPopupVisible = signal<boolean>(true);
}