import { Component, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FlexiButtonComponent } from 'flexi-button';
import { FlexiTooltipDirective } from 'flexi-tooltip';
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [SharedModule, FlexiButtonComponent, FlexiTooltipDirective],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export default class ButtonComponent {
  buttonTSCodeExample = signal<string>(`
import { FlexiButtonComponent } from 'flexi-button';
import { FlexiTooltipDirective } from 'flexi-tooltip';

@Component({
  imports: [FlexiButtonComponent, FlexiTooltipDirective],
})
export default class ButtonComponent {
 //Normalde FlexiGridModule içerisinde var. Eğer onu import ettiyseniz button ve tooltip için import yapmanıza gerek yok
}
`);
    
  buttonHTMLCodeExample = signal<string>(`
<div style="display: flex; flex-direction: column; gap:5px">
    <div style="display: flex; gap: 5px;">
        <flexi-button btnColor="default" btnSize="small" btnIcon="info" flexiTooltip="top" title="Aç" />
        <flexi-button btnColor="primary" btnSize="small" btnIcon="add" flexiTooltip="top" title="Kaydet" />
        <flexi-button btnColor="warning" btnSize="small" btnIcon="edit" flexiTooltip="top" title="Güncelle" />
        <flexi-button btnColor="danger" btnSize="small" btnIcon="delete" flexiTooltip="top" title="Sil" />
        <flexi-button btnColor="info" btnSize="small" btnIcon="visibility" flexiTooltip="top" title="Göster" />
        <flexi-button btnColor="dark" btnSize="small" btnIcon="remove" flexiTooltip="top" title="Çıkart" />
    </div>

    <div style="display: flex; gap: 5px;">
        <flexi-button btnColor="default" btnSize="default" btnIcon="info" flexiTooltip="top" title="Aç" />
        <flexi-button btnColor="primary" btnSize="default" btnIcon="add" flexiTooltip="top" title="Kaydet" />
        <flexi-button btnColor="warning" btnSize="default" btnIcon="edit" flexiTooltip="top" title="Güncelle" />
        <flexi-button btnColor="danger" btnSize="default" btnIcon="delete" flexiTooltip="top" title="Sil" />
        <flexi-button btnColor="info" btnSize="default" btnIcon="visibility" flexiTooltip="top" title="Göster" />
        <flexi-button btnColor="dark" btnSize="default" btnIcon="remove" flexiTooltip="top" title="Çıkart" />
    </div>

    <div style="display: flex; gap: 5px;">
        <flexi-button btnColor="default" btnSize="large" btnIcon="info" flexiTooltip="top" title="Aç" />
        <flexi-button btnColor="primary" btnSize="large" btnIcon="add" flexiTooltip="top" title="Kaydet" />
        <flexi-button btnColor="warning" btnSize="large" btnIcon="edit" flexiTooltip="top" title="Güncelle" />
        <flexi-button btnColor="danger" btnSize="large" btnIcon="delete" flexiTooltip="top" title="Sil" />
        <flexi-button btnColor="info" btnSize="large" btnIcon="visibility" flexiTooltip="top" title="Göster" />
        <flexi-button btnColor="dark" btnSize="large" btnIcon="remove" flexiTooltip="top" title="Çıkart" />
    </div>

    <div style="display: flex; gap: 5px;">
        <flexi-button btnColor="default" btnSize="small" btnIcon="info" btnText="Aç" />
        <flexi-button btnColor="primary" btnSize="small" btnIcon="add" btnText="Kaydet" />
        <flexi-button btnColor="warning" btnSize="small" btnIcon="edit" btnText="Güncelle" />
        <flexi-button btnColor="danger" btnSize="small" btnIcon="delete" btnText="Sil" />
        <flexi-button btnColor="info" btnSize="small" btnIcon="visibility" btnText="Göster" />
        <flexi-button btnColor="dark" btnSize="small" btnIcon="remove" btnText="Çıkart" />
    </div>

    <div style="display: flex; gap: 5px;">
        <flexi-button btnColor="default" btnSize="default" btnIcon="info" btnText="Aç" />
        <flexi-button btnColor="primary" btnSize="default" btnIcon="add" btnText="Kaydet" />
        <flexi-button btnColor="warning" btnSize="default" btnIcon="edit" btnText="Güncelle" />
        <flexi-button btnColor="danger" btnSize="default" btnIcon="delete" btnText="Sil" />
        <flexi-button btnColor="info" btnSize="default" btnIcon="visibility" btnText="Göster" />
        <flexi-button btnColor="dark" btnSize="default" btnIcon="remove" btnText="Çıkart" />
    </div>

    <div style="display: flex; gap: 5px;">
        <flexi-button btnColor="default" btnSize="large" btnIcon="info" btnText="Aç" />
        <flexi-button btnColor="primary" btnSize="large" btnIcon="add" btnText="Kaydet" />
        <flexi-button btnColor="warning" btnSize="large" btnIcon="edit" btnText="Güncelle" />
        <flexi-button btnColor="danger" btnSize="large" btnIcon="delete" btnText="Sil" />
        <flexi-button btnColor="info" btnSize="large" btnIcon="visibility" btnText="Göster" />
        <flexi-button btnColor="dark" btnSize="large" btnIcon="remove" btnText="Çıkart" />
    </div>
</div>
    `)
}
