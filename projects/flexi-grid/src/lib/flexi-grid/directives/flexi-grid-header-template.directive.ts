import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[flexiGridHeaderTemplate]' 
})
export class FlexiGridHeaderTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) { }
}
