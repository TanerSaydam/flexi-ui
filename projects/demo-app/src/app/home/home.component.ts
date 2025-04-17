import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiToastService } from '../../../../../libs/flexi-toast/src/lib/flexi-toast.service';
import { FlexiSelectModule } from '../../../../../libs/flexi-select/src/lib/flexi-select.module';
import { FlexiPopupModule } from "../../../../../libs/flexi-popup/src/lib/flexi-popup.module";


@Component({
  imports: [
    BlankComponent,
    FlexiSelectModule,
    FlexiPopupModule
],
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  readonly data = signal<any[]>([{id: "1", name:"Taner Saydam"}]);
}