import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { TrCurrencyPipe } from 'tr-currency';
import { FlexiToastService } from '../../../../../libs/flexi-toast/src/lib/flexi-toast.service';


@Component({
  imports: [
    BlankComponent,
    TrCurrencyPipe,
  ],
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  readonly #toast = inject(FlexiToastService);

  showToast(){
    this.#toast.showToast("Başarılı","This is a message","success");
  }

  showSwall(){
    this.#toast.showSwal("Confirm","Kaydı silmek istiyor musunuz?","Sil",() => {

    })
  }
}