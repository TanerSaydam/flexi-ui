import { CommonModule } from '@angular/common';
import { Component, ContentChildren, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, QueryList, SimpleChanges, TemplateRef, ViewChild, computed, signal } from '@angular/core';
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
  @Input() height: string = "420px";
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
  @Input() indexWidth: string = "70px";
  @Input() columnVisibilityBtnClass: string = "my-btn";
  @Input() refreshDataBtnClass: string = "my-btn";
  @Input() exportExcelBtnClass: string = "my-btn";
  @Input() exportExcelFileName: string = "excel-export";
  @Input() exportExcelButtonClick: (() => void) | undefined;
  @Input() footerPerPageText: string = "items per page";
  @Input() resizable: boolean = false;
  @Input() draggable: boolean = false;

  pageNumbers = signal<number[]>([]);
  totalPageCount = signal<number>(0);
  state: StateModel = new StateModel();
  pagedData = signal<any[]>([]);
  timeoutId: any;
  filterDropdownVisible = signal<{ [key: string]: boolean }>({});
  columnVisibilityDropdownVisible = signal(false);
  textFilterTypes = signal<{ operator: string, value: string }[]>([
    { operator: "eq", value: 'Eşittir' },
    { operator: "ne", value: 'Eşit değildir' },
    { operator: "contains", value: 'İçerir' },
    { operator: "not contains", value: 'İçermez' },
    { operator: "startswith", value: 'İle başlar' },
    { operator: "endswith", value: 'İle biter' }
  ]);
  numberFilterTypes = signal<{ operator: string, value: string }[]>([
    { operator: "eq", value: 'Eşittir' },
    { operator: "ne", value: 'Eşit değildir' },
    { operator: "gt", value: 'Daha büyüktür' },
    { operator: "ge", value: 'Daha büyüktür ya da eşittir' },
    { operator: "lt", value: 'Daha küçüktür' },
    { operator: "le", value: 'Daha küçüktür ya da eşittir' }
  ]);
  draggedColumnIndex: number | undefined;
  tempDraggable: boolean = false;

  @Output() dataStateChange = new EventEmitter<any>();

  @ContentChildren(FlexiGridColumnComponent) columns: QueryList<FlexiGridColumnComponent> | undefined;

  @ViewChild('table') table: ElementRef | undefined;
  resizingColumn: any;
  startX: number | undefined;
  startWidth: number | undefined;

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
    
    if(!filteredData) {
      this.pagedData.set([]);
      return;
    }

    if (this.filterable && this.state.filter.length > 0 && !this.dataBinding) {
      const filters = this.state.filter.filter(p=> p.value);

      filters.forEach(filter => {
        filteredData = filteredData.filter(item => {
          const field = filter.field;
          const value = filter.value;
          const itemValue = item[field].toString().toLocaleLowerCase('tr');
          const filterValue = value.toString().toLocaleLowerCase('tr');

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
    if(filteredData){
      if (filteredData.length > +this.state.pageSize && !this.dataBinding && this.pageable) {
        const start = this.state.skip;
        const end = start + +this.state.pageSize;
        this.pagedData.set(filteredData.slice(start, end));
      } else {
        this.pagedData.set(filteredData);
      }
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
    this.state.pageSize = this.pageSize;
    this.columns?.forEach(val => {
      val.value = "";
    });
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

  onExportExcelButtonClick() {
    if (this.exportExcelButtonClick) {
      this.exportExcelButtonClick();
    } else {
      this.exportExcel();
    }
  }

  exportExcel() {
    const visibleColumns: any[] = this.columns?.filter(column => column.visible).map(column => {
      return { field: column.field, title: column.title || column.field };
    }) || [];
  
    let csvData = visibleColumns.map(col => col.title).join(',') + '\n';

    let exportData = this.data;

    exportData.forEach(row => {
      let rowData = visibleColumns.map(col => {
        // Hücre içeriğindeki virgüller ve çift tırnakları kaçış karakteri ile değiştir
        const cellData = row[col.field] ? row[col.field].toString().replace(/"/g, '""') : '';
        return `"${cellData}"`;
      }).join(',');
      csvData += rowData + '\n';
    });
  
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', this.exportExcelFileName + '.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  onMouseDown(event: MouseEvent | any, column: any) {
    this.resizingColumn = column;
    this.startX = event.pageX;
    this.startWidth = event.target!.parentElement.offsetWidth;

    // Eğer draggable ise, geçici olarak devre dışı bırak
    if (this.draggable) {
      this.tempDraggable = this.draggable;
      this.draggable = false;
    }
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove = (event: MouseEvent) => {
    if (this.resizingColumn) {
      const offset = event.pageX - this.startX!;
      this.resizingColumn.width = this.startWidth! + offset + 'px';
    }
  }

  @HostListener('document:mouseup')
  onMouseUp = () => {
    this.resizingColumn = undefined;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);

    // Resize işlemi bittiğinde draggable durumunu geri yükle
    if (this.tempDraggable) {
      this.draggable = this.tempDraggable;
      this.tempDraggable = false;
    }
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedColumnIndex = index;
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.draggedColumnIndex === undefined) return;

    const draggedColumn = this.columns?.toArray()[this.draggedColumnIndex];
    const targetColumn = this.columns?.toArray()[index];

    if (draggedColumn && targetColumn) {
      const columnsArray = this.columns?.toArray();

      // Remove dragged column and insert it at the new position
      columnsArray!.splice(this.draggedColumnIndex, 1);
      columnsArray!.splice(index, 0, draggedColumn);

      this.columns?.reset(columnsArray!);
    }

    this.draggedColumnIndex = undefined;
  }

  getFieldValue(item: any, field: string){
    if(!field.includes(".")){
      return item[field]
    }else{
      const fields = field.split(".");
      if(fields.length === 2){
       return item[fields[0]][fields[1]]
      }else{
        console.log("Value not found!");        
        return "";
      }
    }
  }
}