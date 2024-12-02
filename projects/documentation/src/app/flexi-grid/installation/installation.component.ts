import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-installation',
    imports: [SharedModule],
    templateUrl: './installation.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush  
})
export default class InstallationComponent {
}
