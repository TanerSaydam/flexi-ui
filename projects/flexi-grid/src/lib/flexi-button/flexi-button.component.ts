import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'flexi-button',
  templateUrl: './flexi-button.component.html',
  styleUrl: './flexi-button.component.css',
  encapsulation: ViewEncapsulation.None
})
export class FlexiBtnComponent implements OnInit {
  @Input() className: string = "flexi-grid-btn";
  @Input() btnColor: BtnColorType = "default";
  @Input() outline: boolean = false;
  
  ngOnInit(): void {
    this.setColor();
  }

  setColor(){
    let prefix = "flexi-grid-btn";
    if(this.outline) prefix = "flexi-grid-btn-outline"
    this.className += ` ${prefix}-${this.btnColor}`
  }
}

export type BtnColorType = 'default' | 'success' | 'info' | 'warning' |  'primary' | 'danger' | 'secondary' | 'dark'