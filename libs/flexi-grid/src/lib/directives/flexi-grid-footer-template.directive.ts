import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[flexiGridFooterTemplate]',
  standalone: false
})
export class FlexiGridFooterTemplateDirective {
 constructor(public templateRef: TemplateRef<any>) { }
}
