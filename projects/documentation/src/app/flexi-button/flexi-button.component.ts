import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../shared.module';
import { FlexiButtonComponent } from 'flexi-button';
declare var Prism: any;
import 'prismjs';
import 'prismjs/components/prism-typescript';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { TranslocoService } from '@jsverse/transloco';

@Component({
    imports: [SharedModule, FlexiButtonComponent, FlexiTooltipDirective],
    templateUrl: './flexi-button.component.html',    
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export default class FlexiButtonDocComponent {
    import = signal<string>(`
 import { FlexiButtonComponent } from 'flexi-button';
 import { FlexiTooltipDirective } from 'flexi-tooltip';

 @Component({
    imports: [FlexiButtonComponent, FlexiTooltipDirective],`);

    withText = signal<string>('<flexi-button btnText="Default button" btnSize="medium"/>');
    withIcon = signal<string>('<flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium"/>');
    withTextAndIcon = signal<string>('<flexi-button btnIcon="print" btnText="With icon" btnSize="medium"/>');
    withColor = signal<string>('<flexi-button btnIcon="print" btnText="With icon" btnSize="medium" btnColor="primary"/>');
    rounded = signal<string>(`<flexi-button btnIcon="print" btnText="With icon" btnSize="medium" btnColor="primary" [btnRounded]="true"/>
<flexi-button btnIcon="print" title="With icon" flexiTooltip="right" btnSize="medium" btnColor="primary" [btnRounded]="true"/>`);
    loading = signal<string>(`<flexi-button btnSize="medium" btnColor="primary" [loading]="true"/>
<flexi-button btnSize="medium" btnColor="primary" [loading]="true" loadingText="Loading..."/>
<flexi-button btnSize="medium" btnColor="primary" [loading]="true" loadingText="Loading..." [btnRounded]="true"/>`);
    size = signal<string>(`
 <div class="d-flex gap-1 align-items-end">
    <flexi-button btnIcon="print" title="With icon" flexiTooltip btnSize="small"/>
    <flexi-button btnIcon="print" title="With icon" flexiTooltip btnSize="medium"/>
    <flexi-button btnIcon="print" title="With icon" flexiTooltip btnSize="large"/>
 </div>
    <div class="d-flex gap-1 align-items-end mt-2">
    <flexi-button btnIcon="print" btnText="With icon" btnSize="small"/>
    <flexi-button btnIcon="print" btnText="With icon" btnSize="medium"/>
    <flexi-button btnIcon="print" btnText="With icon" btnSize="large"/>
 </div>`);
    color = signal<string>(`
<div class="d-flex gap-1">
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="light"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="primary"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="warning"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="info"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="pink"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="danger"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="indigo"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="black"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="purple"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="secondary"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="success"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="teal"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="white"/>
    <flexi-button btnIcon="print" title="with icon" flexiTooltip btnSize="medium" btnColor="yellow"/>
 </div>`)
    width = signal<string>(`<flexi-button btnIcon="print" btnText="with icon" btnSize="medium" btnWidth="20%"/>`);
    customize = signal<string>(`<flexi-button btnSize="medium">
   <span>Customize Button</span>
</flexi-button>`);
    transloco = inject(TranslocoService);

    ngAfterViewInit(): void {
        Prism.highlightAll();
    }

    translate(val: string){
        const text = "FLEXI_BUTTON." + val;
        return this.transloco.translate(text);
    }
}
