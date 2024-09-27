import { AfterViewInit, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'flexi-button',
  templateUrl: './flexi-button.component.html',
  styleUrl: './flexi-button.component.css',
  encapsulation: ViewEncapsulation.None
})
export class FlexiBtnComponent implements AfterViewInit {
  @Input() className: string = "flexi-grid-btn";
  @Input() btnColor: BtnColorType = "default";
  @Input() outline: boolean = false;
  
  ngAfterViewInit(): void {
    this.setColor();
  }

  setColor(){
    let prefix = "flexi-grid-btn";
    if(this.outline) prefix = "flexi-grid-btn-outline"
    this.className += ` ${prefix}-${this.btnColor}`
  }
}

export type BtnColorType = 'default' | 'success' | 'info' | 'warning' |  'primary' | 'danger' | 'secondary' | 'dark'
