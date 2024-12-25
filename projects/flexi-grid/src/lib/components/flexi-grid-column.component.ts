import { Component, ContentChild, SimpleChanges, TemplateRef, output, input, Input } from '@angular/core';
import { FlexiGridFilterDataModel } from '../models/flexi-grid-filter-data.model';
import { FlexiGridCellTemplateDirective } from '../directives/flexi-grid-cell-template.directive';
import { FlexiGridHeaderTemplateDirective } from '../directives/flexi-grid-header-template.directive';

@Component({
    selector: 'flexi-grid-column',
    host: { '[attr.host-id]': '"flexi-grid-column-1"' },
    template: '',
    standalone: false
})
export class FlexiGridColumnComponent {
  @Input() field:string = "";
  @Input() title:string = "";
  readonly sortable = input<boolean>(true);
  readonly filterable = input<boolean>(true);
  @Input() visible: boolean = true;
  readonly filterType = input<FilterType>("text");  
  readonly format = input<string | CurrencyFormatType | null>(null);
  readonly fraction = input<number>(2);
  readonly symbol = input<string>("");
  readonly showSymbolInFront = input<boolean>(true);
  @Input() width: string = "160px";
  readonly resizable = input<boolean>(true);  
  readonly className = input<string>("");
  readonly textAlign = input<TextAlignType>("left");
  @Input() hideOverflow: boolean = true;
  readonly filterData = input<FlexiGridFilterDataModel[]>([]);
  readonly booleanData = input<string[]>([]);
  readonly showCheckbox = input<boolean>(false);
  @Input() filterValue:any;
  @Input() filterValue2:any;
  @Input() showSecondDate = false;

  @ContentChild(FlexiGridCellTemplateDirective, {read: TemplateRef})
  cellTemplate?: TemplateRef<any>;

  @ContentChild(FlexiGridHeaderTemplateDirective, {read: TemplateRef})
  headerTemplate?: TemplateRef<any>;
  
  readonly onChange = output<any>();

  filterOperator: string = "contains";

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterType']) {
      this.setDefaultFilterOperator();
    }
  }

  setDefaultFilterOperator() {
    const filterType = this.filterType();
    if (filterType === 'number') {
      this.filterOperator = 'ge';
    }
    else if (filterType === "boolean" || filterType === "select") {
      this.filterOperator = "eq";
    }
    else if (filterType === "date") {
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