import { Component, signal } from '@angular/core';
import { SharedModule } from '../shared.module';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { FlexiButtonComponent } from 'flexi-button';

@Component({
    selector: 'app-flexi-tooltip',
    imports: [SharedModule, FlexiTooltipDirective, FlexiButtonComponent],
    templateUrl: './flexi-tooltip.component.html',
    styleUrl: './flexi-tooltip.component.css'
})
export default class FlexiTooltipComponent {
tooltipTSCodeExample = signal<string>(`
import { FlexiTooltipDirective } from 'flexi-tooltip';

@Component({
  imports: [FlexiTooltipDirective],
})
export default class ExampleComponent { 
}
`);

tooltipHTMLCodeExample = signal<string>(`
<div style="display: flex; gap: 5px;">
    <flexi-button btnColor="light" btnSize="large" btnIcon="info" flexiTooltip="left" title="Aç" />
    <flexi-button btnColor="primary" btnSize="large" btnIcon="add" flexiTooltip="right" title="Kaydet" />
    <flexi-button btnColor="warning" btnSize="large" btnIcon="edit" flexiTooltip="top" title="Güncelle" />
    <flexi-button btnColor="danger" btnSize="large" btnIcon="delete" flexiTooltip="bottom" title="Sil" />
</div>
        `)
}
