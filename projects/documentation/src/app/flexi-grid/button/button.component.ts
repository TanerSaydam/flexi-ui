import { Component, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FlexiGridModule } from 'flexi-grid';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [SharedModule, FlexiGridModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export default class ButtonComponent {
  buttonTSCodeExample = signal<string>(`imports: [FlexiGridModule],`);
  buttonHTMLCodeExample = signal<string>(`
<flexi-button btnColor="primary" [outline]="true">Primary</flexi-button>
<flexi-button btnColor="success" [outline]="true">Success</flexi-button>
<flexi-button btnColor="warning" [outline]="true">Warning</flexi-button>
<flexi-button btnColor="info" [outline]="true">Info</flexi-button>
<flexi-button btnColor="dark" [outline]="true">Dark</flexi-button>

<flexi-button btnColor="default">Default</flexi-button>
<flexi-button btnColor="primary">Primary</flexi-button>
<flexi-button btnColor="success">Success</flexi-button>
<flexi-button btnColor="warning">Warning</flexi-button>
<flexi-button btnColor="info">Info</flexi-button>
<flexi-button btnColor="secondary">Secondary</flexi-button>
<flexi-button btnColor="dark">dark</flexi-button>
    `)
}
