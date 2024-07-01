import { Component, ElementRef, Input, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'flexi-option',
  standalone: true,
  template: '<ng-content></ng-content>',
  encapsulation: ViewEncapsulation.None
})
export class FlexiOptionComponent implements OnInit, AfterViewInit {
  @Input() value: any;
  viewValue: string = "";

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.viewValue = this.el.nativeElement.innerText.trim();
  }

  ngAfterViewInit() {
    this.viewValue = this.el.nativeElement.innerText.trim();
  }
}
