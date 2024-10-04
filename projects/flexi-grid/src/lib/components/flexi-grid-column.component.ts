import { Component, ContentChild, EventEmitter,  Input, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { FlexiGridFilterDataModel } from '../models/flexi-grid-filter-data.model';
import { FlexiGridCellTemplateDirective } from '../directives/flexi-grid-cell-template.directive';
import { FlexiGridHeaderTemplateDirective } from '../directives/flexi-grid-header-template.directive';

@Component({
  selector: 'flexi-grid-column',
  host: { '[attr.host-id]': '"flexi-grid-column-1"' },
  template: ''
})
export class FlexiGridColumnComponent {
  @Input() field: string = '';
  @Input() title: string = '';
  @Input() sortable: boolean = true;
  @Input() filterable: boolean = true;
  @Input() visible: boolean = true;
  @Input() filterType: FilterType = "text";  
  @Input() format: string | CurrencyFormatType | null = null;
  @Input() fraction: number = 2;
  @Input() symbol: string = "";
  @Input() showSymbolInFront: boolean = true;
  @Input() width: string = "180px";
  @Input() resizable: boolean = true;
  @Input() draggable: boolean = true;
  @Input() className: string = "";
  @Input() textAlign: TextAlignType = "left";
  @Input() hideOverflow: boolean = true;
  @Input() filterData: FlexiGridFilterDataModel[] = [];
  @Input() booleanData: string[] = [];
  @Input() showCheckbox: boolean = false;
  @Input() filterValue: any;

  @ContentChild(FlexiGridCellTemplateDirective, {read: TemplateRef})
  cellTemplate?: TemplateRef<any>;

  @ContentChild(FlexiGridHeaderTemplateDirective, {read: TemplateRef})
  headerTemplate?: TemplateRef<any>;
  
  @Output() onChange = new EventEmitter<any>();

  filterOperator: string = "contains";

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterType']) {
      this.setDefaultFilterOperator();
    }
  }

  setDefaultFilterOperator() {
    if (this.filterType === 'number') {
      this.filterOperator = 'ge';
    }
    else if (this.filterType === "boolean" || this.filterType === "select") {
      this.filterOperator = "eq";
    }
    else {
      this.filterOperator = 'contains';
    }
  }
}

export type TextAlignType = "left" | "center" | "right";
export type FilterType = "text" | "date" | "date-time" | "number" | "select" | "boolean"

export type CurrencyFormatType = "n" | "c"