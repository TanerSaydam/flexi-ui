import { ChangeDetectionStrategy, Component, input, signal, TemplateRef, viewChild, ViewEncapsulation, contentChild } from '@angular/core';
import { NgForm } from '@angular/forms';

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
  readonly isValid = input<boolean | null>(true);
}
