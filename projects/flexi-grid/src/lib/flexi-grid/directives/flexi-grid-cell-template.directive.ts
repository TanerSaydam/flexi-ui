import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[flexiGridCellTemplate]',  
})
export class FlexiGridCellTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) { }
}
