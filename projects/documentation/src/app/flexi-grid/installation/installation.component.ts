import { Component } from '@angular/core';
import { BlankComponent } from "../../../../../demo-app/src/app/blank/blank.component";
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-installation',
    imports: [SharedModule],
    templateUrl: './installation.component.html',
    styleUrl: './installation.component.css'
})
export default class InstallationComponent {

}
