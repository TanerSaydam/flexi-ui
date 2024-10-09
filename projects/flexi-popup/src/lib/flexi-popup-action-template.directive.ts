import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({
  selector: '[flexiPopupActionTemplate]',  
})
export class FlexiPopupActionTemplateDirective {
  templateRef = inject(TemplateRef<any>);
}