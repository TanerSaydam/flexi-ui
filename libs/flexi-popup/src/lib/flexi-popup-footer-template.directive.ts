import { Directive, TemplateRef } from '@angular/core';

@Directive({
  standalone: false,
  selector: '[flexiPopupFooterTemplate]'
})
export class FlexiPopupFooterTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) { }
}