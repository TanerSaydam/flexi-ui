import { Component, ContentChild, SimpleChanges, TemplateRef, output, input, Input, signal, linkedSignal } from '@angular/core';
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
  readonly field = input<string>("");
  readonly title = input<string>("");
  readonly sortable = input<boolean>(true);
  readonly filterable = input<boolean>(true);
  readonly visible = input<boolean>(true);
  readonly filterType = input<FilterType>("text");  
  readonly format = input<string | CurrencyFormatType | null>(null);
  readonly fraction = input<number>(2);
  readonly symbol = input<string>("");
  readonly showSymbolInFront = input<boolean>(true);
  readonly width = input<string>("160px");
  readonly resizable = input<boolean>(true);  
  readonly className = input<string>("");
  readonly textAlign = input<TextAlignType>("left");
  readonly hideOverflow = input<boolean>(true);
  readonly filterData = input<FlexiGridFilterDataModel[]>([]);
  readonly booleanData = input<string[]>([]);
  readonly showCheckbox = input<boolean>(false);
  readonly filterValue = input<any>();
  readonly filterValue2 = input<any>();
  readonly showSecondDate = signal<boolean>(false);  

  readonly filterOperator = signal<string>("contains");
  readonly filterValueSignal = linkedSignal(()=> this.filterValue());
  readonly filterValue2Signal = linkedSignal(()=> this.filterValue2());
  readonly visibleSignal = linkedSignal(() => this.visible());
  readonly widthSignal = linkedSignal(() => this.width());  
  
  readonly onChange = output<any>();

  @ContentChild(FlexiGridCellTemplateDirective, {read: TemplateRef})
  cellTemplate?: TemplateRef<any>;

  @ContentChild(FlexiGridHeaderTemplateDirective, {read: TemplateRef})
  headerTemplate?: TemplateRef<any>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterType']) {
      this.setDefaultFilterOperator();
    }
  }

  setDefaultFilterOperator() {
    const filterType = this.filterType();
    if (filterType === 'number') {
      this.filterOperator.set('ge');
    }
    else if (filterType === "boolean" || filterType === "select") {
      this.filterOperator.set("eq");
    }
    else if (filterType === "date") {
      this.filterOperator.set("eq");
    }
    else {
      this.filterOperator.set('contains');
    }
  }
}

export type TextAlignType = "left" | "center" | "right";
export type FilterType = "text" | "date" | "date-time" | "number" | "select" | "boolean"

export type CurrencyFormatType = "n" | "c"