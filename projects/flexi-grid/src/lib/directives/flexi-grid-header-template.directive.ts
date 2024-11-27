import { Directive, TemplateRef } from '@angular/core';

@Directive({
    selector: '[flexiGridHeaderTemplate]',
    standalone: false
})
export class FlexiGridHeaderTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) { }
}