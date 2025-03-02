import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[flexiGridCaptionCommandTemplate]',
  standalone: false
})
export class FlexiGridCaptionCommandTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) { }
}