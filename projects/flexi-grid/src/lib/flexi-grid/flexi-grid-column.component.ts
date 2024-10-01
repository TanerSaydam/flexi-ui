import { Component, ContentChild, EventEmitter, input, Input, OnChanges, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { FlexiGridFilterDataModel } from './flexi-grid-filter-data.model';
import { FlexiGridCellTemplateDirective } from './directives/flexi-grid-cell-template.directive';
import { FlexiGridHeaderTemplateDirective } from './directives/flexi-grid-header-template.directive';

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
  @Input() format: DateFormatType | DateTimeFormatType | CurrencyFormatType | null = null;
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
export type DateFormatType =
  "d" | "dd" | "ddd" | "dddd" | 
  "M" | "MM" | "MMM" | "MMMM" | 
  "yy" | "yyyy" |
  "dd.MM.yyyy" | "dd.MMM.yyyy" | "dd.MMMM.yyyy" | "dd.MM.yy" | "dd.MMM.yy" | "dd.MMMM.yy" | 
  "MM/dd/yyyy" | "MMM/dd/yyyy" | "MMMM/dd/yyyy" |  "MM/dd/yy" | "MMM/dd/yy" | "MMMM/dd/yy" |
  "yyyy-MM-dd" | 
  "dd MM yyyy" | "dd MMM yyyy" | "dd MMMM yyyy" | "dd MM yy" | "dd MMM yy" | "dd MMMM yy" |
  "MMMM dd, yyyy" |
  "d/M/yyyy" | "d/M/yy" | "dd/MM/yyyy" | "MM/dd/yy";

  export type DateTimeFormatType =
  "H" | "HH" | "HH:mm:ss" | "HH:mm:ss.SSS" | "MM/dd/yy HH:mm" | "MM/dd/yy HH:mm:ss" | "MM/dd/yyyy HH:mm" | "MM/dd/yyyy HH:mm:ss"| 
  "MMM/dd/yy HH:mm" | "MMM/dd/yy HH:mm:ss" | "MMM/dd/yyyy HH:mm" | "MMM/dd/yyyy HH:mm:ss" | "MMMM dd, yyyy HH:mm" | 
  "MMMM/dd/yy HH:mm" | "MMMM/dd/yy HH:mm:ss" | "MMMM/dd/yyyy HH:mm" | "MMMM/dd/yyyy HH:mm:ss" | 
  "dd MM yy HH:mm" | "dd MM yyyy HH:mm" |
  "dd MMM yy HH:mm" | "dd MMM yyyy" | "dd MMM yyyy HH:mm" |
  "dd MMMM yy HH:mm" | "dd MMMM yyyy" | "dd MMMM yyyy HH:mm" |
  "dd-MM-yyyy HH:mm:ss" |
  "dd.MM.yy HH:mm" | "dd.MM.yy HH:mm:ss" |
  "dd.MM.yyyy HH:mm" | "dd.MM.yyyy HH:mm:ss" |
  "dd.MMM.yy HH:mm" | "dd.MMM.yy HH:mm:ss" |
  "dd.MMM.yyyy HH:mm" | "dd.MMM.yyyy HH:mm:ss" |
  "dd.MMMM.yy HH:mm" | "dd.MMMM.yy HH:mm:ss" |
  "dd.MMMM.yyyy HH:mm" | "dd.MMMM.yyyy HH:mm:ss" |
  "dd/MM/yyyy HH:mm" |
  "h" | "hh" | "hh:mm:ss a" |
  "m" | "mm" | "s" | "ss" |
  "yyyy-MM-dd HH:mm" | "yyyy-MM-dd HH:mm:ss" |
  "yyyy-MM-ddTHH:mm:ss" | "yyyy-MM-ddTHH:mm:ss.SSS" | "yyyy-MM-ddTHH:mm:ss.SSSZ" | "yyyy-MM-ddTHH:mm:ssZ";

export type CurrencyFormatType = "n" | "c"