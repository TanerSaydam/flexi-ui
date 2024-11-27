import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-blank',
    imports: [],
    templateUrl: './blank.component.html',
    styleUrl: './blank.component.css',
    encapsulation: ViewEncapsulation.None
})
export class BlankComponent {
  @Input() pageName:string = "";
  @Input() pageDescription: string = "";
}
