import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-blank',
    imports: [TranslocoModule],
    templateUrl: './blank.component.html',    
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlankComponent {
  readonly pageName = input<string>("");
  readonly pageDescription = input<string>("");
}
