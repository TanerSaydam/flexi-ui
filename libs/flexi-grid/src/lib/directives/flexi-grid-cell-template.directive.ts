import { Directive, TemplateRef } from '@angular/core';

@Directive({
    selector: '[flexiGridCellTemplate]',
    standalone: false
})
export class FlexiGridCellTemplateDirective {
  constructor(public templateRef: TemplateRef<any>) { }
}
