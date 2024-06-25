import { CommonModule } from '@angular/common';
import { Component, ContentChildren, EventEmitter, Input, OnChanges, Output, QueryList, SimpleChanges, TemplateRef, ViewChild, computed, signal } from '@angular/core';
import { FilterType, FlexiGridColumnComponent } from './flexi-grid-column.component';
import { StateFilterModel, StateModel } from './state.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'flexi-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flexi-grid.component.html',
  styleUrl: `./flexi-grid.component.css`
})
export class FlexiGridComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() total: number | null | undefined = 0;
  @Input() pagable: boolean = false;
  @Input() pageSize: number = 10;
  @Input() showIndex: boolean = false;
  @Input() pageSizeList: number[] = [5, 10, 20, 30, 50, 100, 500, 1000];
  @Input() loading: boolean = false;
  @Input() orderable: boolean = true;
  @Input() themeClass: string = "light";
  @Input() height: number = 400;
  @Input() filterable: boolean = false;
  @Input() tableTitle: string = "";
  @Input() captionTemplate: TemplateRef<any> | any;
  @Input() footerTemplate: TemplateRef<any> | any;
  @Input() showColumnVisibility: boolean = true;
  @Input() showRefreshData: boolean = true;
  @Input() dataBinding: boolean = false;

  pageNumbers: number[] = [];
  totalPageCount = 0;
  state: StateModel = new StateModel();
  pagedData: any[] = [];
  timeoutId: any;
  filterDropdownVisible = signal<{ [key: string]: boolean }>({});
  columnVisibilityDropdownVisible = signal(false);
  textFilterTypes: { operator: string, value: string }[] = [
    { operator: "eq", value: 'Is equal to' },
    { operator: "ne", value: 'Is not equal to' },
    { operator: "contains", value: 'Contains' },
    { operator: "not contains", value: 'Does not contain' },
    { operator: "startswith", value: 'Starts with' },
    { operator: "endswith", value: 'Ends with' }
  ];
  numberFilterTypes: { operator: string, value: string }[] = [
    { operator: "eq", value: 'Is equal to' },
    { operator: "ne", value: 'Is not equal to' },
    { operator: "gt", value: 'Is greater than' },
    { operator: "ge", value: 'Is greater than or equal to' },
    { operator: "lt", value: 'Is less than' },
    { operator: "le", value: 'Is less than or equal to' }
  ];

  @Output() dataStateChange = new EventEmitter<any>();
  @Output() refreshData = new EventEmitter();

  @ContentChildren(FlexiGridColumnComponent) columns: QueryList<FlexiGridColumnComponent> | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.pageSize !== this.state.pageSize) {
      this.state.pageSize = this.pageSize;
    }

    if (this.pagable) {
      this.setPageNumbers();
      this.updatePagedData();
    } else {
      this.pagedData = this.data;
    }
  }

  changePage(pageNumber: number) {
    if (pageNumber > this.totalPageCount) {
      pageNumber = this.totalPageCount;
    } else if (pageNumber < 1) {
      pageNumber = 1;
    }

    const previousPageNumber = this.state.pageNumber;
    this.state.pageNumber = pageNumber;
    this.state.skip = (pageNumber - 1) * this.state.pageSize;
    this.dataStateChange.emit(this.state);

    // Check if the page number crossed a 10-page boundary
    const previousGroup = Math.floor((previousPageNumber - 1) / 10);
    const currentGroup = Math.floor((pageNumber - 1) / 10);

    if (currentGroup > previousGroup) {
      this.nextPageGroup();
    } else if (currentGroup < previousGroup) {
      this.previousPageGroup();
    } else {
      // If the group hasn't changed, update the page numbers
      this.setPageNumbers();
    }

    this.updatePagedData();
  }

  setPageNumbers() {    
    const pageCount = Math.ceil(this.total! / this.state.pageSize);
    const numbers = [];

    // Calculate the current range of page numbers
    const currentGroup = Math.floor((this.state.pageNumber - 1) / 10);
    const startPage = currentGroup * 10 + 1;
    const endPage = Math.min(startPage + 9, pageCount);

    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }

    this.pageNumbers = numbers;
    this.totalPageCount = pageCount;
  }

  nextPageGroup() {
    const pageCount = Math.ceil(this.total! / this.state.pageSize);
    const currentGroup = Math.floor((this.state.pageNumber - 1) / 10);
    const nextGroupStartPage = (currentGroup + 1) * 10 + 1;

    if (nextGroupStartPage <= pageCount) {
      this.state.pageNumber = nextGroupStartPage;
    }

    this.setPageNumbers();
    this.updatePagedData();
  }

  previousPageGroup() {
    const currentGroup = Math.floor((this.state.pageNumber - 1) / 10);
    const previousGroupStartPage = (currentGroup - 1) * 10 + 1;

    if (previousGroupStartPage > 0) {
      this.state.pageNumber = previousGroupStartPage;
    }

    this.setPageNumbers();
    this.updatePagedData();
  }

  changePageSize() {
    this.state.pageNumber = 1;
    if (this.pagable) {
      this.dataStateChange.emit(this.state);
    } else {
      this.updatePagedData();
    }
  }

  updatePagedData() {
    let filteredData = this.data;
    
    if (this.filterable && this.state.filter.length > 0 && !this.dataBinding) {
      this.state.filter.forEach(filter => {
        filteredData = filteredData.filter(item => {
          const field = filter.field;
          const value = filter.value;
          return item[field].toString().toLowerCase().includes(value);
        });
      });      
    }
  
    // Order data if orderable is true
    if (this.orderable && this.state.order.field && !this.dataBinding) {
      filteredData = filteredData.sort((a, b) => {
        const field = this.state.order.field;
        const dir = this.state.order.dir === 'asc' ? 1 : -1;
        if (a[field] < b[field]) return -1 * dir;
        if (a[field] > b[field]) return 1 * dir;
        return 0;
      });
    }

    if(!this.dataBinding){
      this.total = filteredData.length;
      this.setPageNumbers();
    }
  
    // Pagination logic
    if (filteredData.length > this.state.pageSize && !this.dataBinding) {
      const start = this.state.skip;
      const end = start + this.state.pageSize;
      this.pagedData = filteredData.slice(start, end);
    } else {
      this.pagedData = filteredData;
    }
  }

  orderData() {
    this.data = this.data.sort((a, b) => {
      const field = this.state.order.field;
      const dir = this.state.order.dir === 'asc' ? 1 : -1;
      if (a[field] < b[field]) return -1 * dir;
      if (a[field] > b[field]) return 1 * dir;
      return 0;
    });

    this.dataStateChange.emit(this.state);
  }

  order(field: string) {
    this.state.order.field = field;
    if (this.state.order.dir === "asc") {
      this.state.order.dir = "desc";
    } else if (this.state.order.dir === 'desc') {
      this.state.order.dir = "";
      this.state.order.field = '';
    } else {
      this.state.order.dir = 'asc'
    }

    this.orderData();
  }

  toggleTheme() {
    this.themeClass = this.themeClass === 'light' ? 'dark' : 'light';
  }

  toggleFilterDropdown(field: string) {
    this.filterDropdownVisible()[field] = !this.filterDropdownVisible()[field];
  }

  applyFilter(column: FlexiGridColumnComponent, operator: string){    
    this.filterDropdownVisible()[column.field] = false;    
    column.fitlerOperator = operator;
    if(column.value !== ""){
      this.filter(column.field, operator, column.value, column.filterType);
    }
  }

  filter(field: string, operator: string, value: string, type: FilterType) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (value !== "") {
        let filterField = this.state.filter.find(p => p.field === field);
        if (filterField) {
          filterField.value = value;
          filterField.operator = operator;
        } else {
          filterField = new StateFilterModel();
          filterField.field = field;
          filterField.operator = operator;
          filterField.value = value;
          filterField.type = type
          this.state.filter.push(filterField);
        }
      } else {
        const findIndex = this.state.filter.findIndex(p => p.field === field);

        if (findIndex > -1) {
          this.state.filter.splice(findIndex, 1);
        }
      }

      this.dataStateChange.emit(this.state);
      this.updatePagedData();
    }, this.dataBinding ? 500 : 0);
  }

  showClearFilter(value: any) {
    if (value) return true;
    return false;
  }

  clearFilter(field: string) {
    this.filter(field, "contains", "", "text");
    const column = this.columns?.find(p => p.field === field);
    if (column) {
      column.value = "";
    }
  }

  toggleColumnVisibilityDropdown() {
    this.columnVisibilityDropdownVisible.set(!this.columnVisibilityDropdownVisible())
  }

  refreshDataMethod(){
    this.refreshData.emit();
  }
}