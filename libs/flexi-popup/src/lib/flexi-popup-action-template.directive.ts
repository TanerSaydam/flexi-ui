import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({
    selector: '[flexiPopupActionTemplate]',
    standalone: false
})
export class FlexiPopupActionTemplateDirective {
  templateRef = inject(TemplateRef<any>);
}