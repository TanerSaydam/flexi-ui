import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../shared.module';
import { FlexiButtonComponent } from 'flexi-button';

@Component({
    imports: [SharedModule, FlexiButtonComponent],
    templateUrl: './flexi-button.component.html',    
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export default class FlexiButtonDocComponent {
    import = signal<string>(`import { FlexiButtonComponent } from 'flexi-button';

@Component({
    imports: [FlexiButtonComponent],`);
}
