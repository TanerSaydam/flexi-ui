import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[flexiGridColumnCommandTemplate]',
  standalone: false
})
export class FlexiGridColumnCommandTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) { }
}