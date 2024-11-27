import { Component, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-installation',
    imports: [
        SharedModule
    ],
    templateUrl: './installation.component.html',
    styleUrl: './installation.component.css'
})
export default class InstallationComponent {
  angularJSONCode = signal<string>(`{
    "styles": [
        "./node_modules/flexi-toast/src/flexi-toast.css"
    ]
}`)
}
