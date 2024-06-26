import { CommonModule } from '@angular/common';
import { Component, ContentChildren, EventEmitter, HostListener, Input, OnChanges, Output, QueryList, SimpleChanges, TemplateRef, ViewChild, computed, signal } from '@angular/core';
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
  @Input() pageable: boolean = false;
  @Input() pageSize: number = 10;
  @Input() showIndex: boolean = false;
  @Input() pageSizeList: number[] = [5, 10, 20, 30, 50, 100, 500, 1000];
  @Input() loading: boolean = false;
  @Input() sortable: boolean = false;
  @Input() themeClass: string = "light";
  @Input() height: number = 420;
  @Input() filterable: boolean = false;
  @Input() captionTitle: string = "";
  @Input() captionTemplate: TemplateRef<any> | any;
  @Input() footerTemplate: TemplateRef<any> | any;
  @Input() showColumnVisibility: boolean = true;
  @Input() showRefreshData: boolean = true;
  @Input() dataBinding: boolean = false;
  @Input() showCaption: boolean = false;
  @Input() showExportExcel: boolean = false;
  @Input() autoHeight: boolean = false;
  @Input() minWidth: string = "1050px";
  @Input() useMinWidth: boolean = true;
  @Input() autoWidth: boolean = false;
  @Input() width: string = "100%";

  pageNumbers = signal<number[]>([]);
  totalPageCount = signal<number>(0);
  state: StateModel = new StateModel();
  pagedData = signal<any[]>([]);
  timeoutId: any;
  filterDropdownVisible = signal<{ [key: string]: boolean }>({});
  columnVisibilityDropdownVisible = signal(false);
  textFilterTypes = signal<{ operator: string, value: string }[]>([
    { operator: "eq", value: 'Is equal to' },
    { operator: "ne", value: 'Is not equal to' },
    { operator: "contains", value: 'Contains' },
    { operator: "not contains", value: 'Does not contain' },
    { operator: "startswith", value: 'Starts with' },
    { operator: "endswith", value: 'Ends with' }
  ]);
  numberFilterTypes = signal<{ operator: string, value: string }[]>([
    { operator: "eq", value: 'Is equal to' },
    { operator: "ne", value: 'Is not equal to' },
    { operator: "gt", value: 'Is greater than' },
    { operator: "ge", value: 'Is greater than or equal to' },
    { operator: "lt", value: 'Is less than' },
    { operator: "le", value: 'Is less than or equal to' }
  ]);

  @Output() dataStateChange = new EventEmitter<any>();  

  @ContentChildren(FlexiGridColumnComponent) columns: QueryList<FlexiGridColumnComponent> | undefined;

  ngOnChanges(changes: SimpleChanges): void {   
    if (this.pageSize !== this.state.pageSize) {     
      this.state.pageSize = +this.pageSize;
    }

    if (this.pageable) {
      this.setPageNumbers();
      this.updatePagedData();
    } else {
      this.pagedData.set(this.data);
    }
  }

  changePage(pageNumber: number) {
    if (pageNumber > this.totalPageCount()) {
      pageNumber = this.totalPageCount();
    } else if (pageNumber < 1) {
      pageNumber = 1;
    }

    const previousPageNumber = this.state.pageNumber;
    this.state.pageNumber = +pageNumber;
    this.state.skip = (pageNumber - 1) * +this.state.pageSize;
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
    const pageCount = Math.ceil(this.total! / +this.state.pageSize);
    const numbers = [];

    // Calculate the current range of page numbers
    const currentGroup = Math.floor((this.state.pageNumber - 1) / 10);
    const startPage = currentGroup * 10 + 1;
    const endPage = Math.min(startPage + 9, pageCount);

    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }
    
    this.pageNumbers.set(numbers);
    this.totalPageCount.set(pageCount);
  }

  nextPageGroup() {
    const pageCount = Math.ceil(this.total! / +this.state.pageSize);
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

  changePageSize(event:any) {
    const value = +event.target.value;
    this.state.pageSize = value;
    this.state.pageNumber = 1;
    this.state.skip = 0;
    if (this.pageable && this.dataBinding) {
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
          const itemValue = item[field].toString().toLowerCase();
          const filterValue = value.toString().toLowerCase();
    
          switch (filter.operator) {
            case 'eq':
              return itemValue === filterValue;
            case 'ne':
              return itemValue !== filterValue;
            case 'contains':
              return itemValue.includes(filterValue);
            case 'not contains':
              return !itemValue.includes(filterValue);
            case 'startswith':
              return itemValue.startsWith(filterValue);
            case 'endswith':
              return itemValue.endsWith(filterValue);
            case 'gt':
              return parseFloat(itemValue) > parseFloat(filterValue);
            case 'ge':
              return parseFloat(itemValue) >= parseFloat(filterValue);
            case 'lt':
              return parseFloat(itemValue) < parseFloat(filterValue);
            case 'le':
              return parseFloat(itemValue) <= parseFloat(filterValue);
            default:
              return true;
          }
        });
      });
    }
  
    // Order data if sortable is true
    if (this.sortable && this.state.sort.field && !this.dataBinding) {
      filteredData = filteredData.sort((a, b) => {
        const field = this.state.sort.field;
        const dir = this.state.sort.dir === 'asc' ? 1 : -1;
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
    if (filteredData.length > +this.state.pageSize && !this.dataBinding && this.pageable) {
      const start = this.state.skip;
      const end = start + +this.state.pageSize;
      this.pagedData.set(filteredData.slice(start, end));
    } else {
      this.pagedData.set(filteredData);
    }
  }

  sortData() {
    this.data = this.data.sort((a, b) => {
      const field = this.state.sort.field;
      const dir = this.state.sort.dir === 'asc' ? 1 : -1;
      if (a[field] < b[field]) return -1 * dir;
      if (a[field] > b[field]) return 1 * dir;
      return 0;
    });

    if(this.dataBinding){
      this.dataStateChange.emit(this.state);
    }else{
      this.updatePagedData();
    }
  }

  sort(field: string) {
    this.state.sort.field = field;
    this.state.pageNumber = 1;
    if (this.state.sort.dir === "asc") {
      this.state.sort.dir = "desc";
    } else if (this.state.sort.dir === 'desc') {
      this.state.sort.dir = "";
      this.state.sort.field = '';
    } else {
      this.state.sort.dir = 'asc'
    }

    this.sortData();
  }

  toggleTheme() {
    this.themeClass = this.themeClass === 'light' ? 'dark' : 'light';
  }

  toggleFilterDropdown(field: string) {
    this.filterDropdownVisible()[field] = !this.filterDropdownVisible()[field];
  }

  applyFilter(column: FlexiGridColumnComponent, operator: string){    
    this.filterDropdownVisible()[column.field] = false;    
    column.filterOperator = operator;
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
        this.state.pageNumber = 1;
        this.state.skip = 0;
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

      if(this.dataBinding){
        this.dataStateChange.emit(this.state);
      }else{
        this.updatePagedData();
      }
    }, this.dataBinding ? 500 : 1);
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

    if(this.dataBinding){

    }else{
      this.updatePagedData();
    }
  }

  toggleColumnVisibilityDropdown() {
    this.columnVisibilityDropdownVisible.set(!this.columnVisibilityDropdownVisible())
  }

  refreshDataMethod(){
    this.state = new StateModel();
    this.dataStateChange.emit(this.state);
  }

  closeAllDropdowns(){
    for(let i in this.filterDropdownVisible()){
      this.filterDropdownVisible()[i] = false;      
    }
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-menu') && !target.closest('.svg')) {
      this.closeAllDropdowns();
    }

    if(!target.closest('.dropdown-menu') && !target.closest('button')){
      this.columnVisibilityDropdownVisible.set(false);
    }
  }

  exportExcel(){
    
  }
}