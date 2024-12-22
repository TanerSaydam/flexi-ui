import { ChangeDetectionStrategy, Component, input, signal, TemplateRef, viewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'flexi-step',
  standalone: false,
  templateUrl: './flexi-step.component.html',  
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiStepComponent {
  readonly flexiStepTitle = input<string>('');  
  readonly templateRef = viewChild.required<TemplateRef<any>>('stepTemplate');  
}
