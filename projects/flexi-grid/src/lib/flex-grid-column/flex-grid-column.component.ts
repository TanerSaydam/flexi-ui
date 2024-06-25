import { Component, Input } from '@angular/core';

@Component({
  selector: 'flex-grid-column',
  standalone: true,
  imports: [],
  template:''
})
export class FlexGridColumnComponent {
  @Input() field: string = '';
  @Input() title: string = '';
  @Input() orderable: boolean = true;
  @Input() filterable: boolean = true;
  @Input() visible: boolean = true;
  @Input() filterType: FilterType = "text";
  value: string = "";
  fitlerOperator: string  ="contains";  
}

export type FilterType = "text" | "date" | "date-time" | "number"
