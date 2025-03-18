import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { TrCurrencyPipe } from 'tr-currency';
import { FlexiPopupModule } from '../../../../../libs/flexi-popup/src/lib/flexi-popup.module';


@Component({
  imports: [
    BlankComponent,
    FlexiPopupModule,
    TrCurrencyPipe,
  ],
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  
}