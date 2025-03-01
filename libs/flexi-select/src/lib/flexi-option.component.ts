import { Component, ElementRef, OnInit, AfterViewInit, ViewEncapsulation, input } from '@angular/core';

@Component({
  selector: 'flexi-option',
  standalone: true,
  template: '<ng-content></ng-content>',
  encapsulation: ViewEncapsulation.None
})
export class FlexiOptionComponent implements OnInit, AfterViewInit {
  readonly value = input<any>();
  viewValue: string = "";

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.viewValue = this.el.nativeElement.innerText.trim();
  }

  ngAfterViewInit() {
    this.viewValue = this.el.nativeElement.innerText.trim();
  }
}
