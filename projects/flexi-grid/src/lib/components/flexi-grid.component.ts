import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, TemplateRef, ViewEncapsulation, inject, signal, output, input, contentChildren, viewChild, AfterContentInit } from '@angular/core';
import { FilterType, FlexiGridColumnComponent, TextAlignType } from './flexi-grid-column.component';
import { StateFilterModel, StateModel } from '../models/state.model';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { FlexiGridReorderModel } from '../models/flexi-grid-reorder.model';

@Component({
    selector: 'flexi-grid',
    templateUrl: './flexi-grid.component.html',
    styleUrl: `./flexi-grid.component.css`,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class FlexiGridComponent implements OnChanges, AfterViewInit {
  @Input({required:true}) data:any[] = [];
  @Input() total:number | null = 0;
  readonly pageable = input<boolean>(true);
  readonly showIndex = input<boolean>(false);
  readonly indexTextAlign = input<TextAlignType>("center");
  readonly pageSizeList = input<number[]>([5, 10, 20, 30, 50, 100, 500, 1000]);
  readonly loading = input<boolean>(false);
  readonly sortable = input<boolean>(true);
  readonly themeClass = input<string>("light");
  readonly filterable = input<boolean>(true);
  readonly captionTitle = input<string>("");
  readonly captionTemplate = input<TemplateRef<any> | any>();
  readonly footerTemplate = input<TemplateRef<any> | any>();
  readonly showColumnVisibility = input<boolean>(true);
  readonly showRefreshBtn = input<boolean>(true);
  readonly dataBinding = input<boolean>(false);
  readonly showCaption = input<boolean>(false);
  readonly showExportExcelBtn = input<boolean>(false);
  readonly autoHeight = input<boolean>(true);
  readonly height = input<string>("500px");
  readonly useMinHeight = input<boolean>(false);
  readonly minHeight = input<string>("500px");
  readonly minWidth = input<string>("1050px");
  readonly useMinWidth = input<boolean>(false);
  readonly autoWidth = input<boolean>(true);
  readonly width = input<string>("100%");
  readonly indexWidth = input<string>("70px");     
  readonly exportExcelFileName = input<string>("excel-export");
  readonly exportExcelButtonClick = input<(() => void)>();  
  readonly resizable = input<boolean>(true);  
  readonly tbodyStyle = input<any>({});
  readonly trMinHeight = input<string>("45px");
  readonly showCommandColumn = input<Boolean>(false);
  readonly commandColumnTitle = input<string>("İşlemler");
  readonly commandColumnWidth = input<string>("100px");
  readonly commandColumnTextAlign = input<AlignSetting>("center");
  readonly commandColumnTemplate = input<TemplateRef<any> | any>();
  readonly stickyCommandColumn = input<boolean>(true);
  readonly fontSize = input<string>("13px");
  readonly dataBindingExportEndpoint = input<string>('');
  readonly dataBindingExportPath = input<string>('data');  
  readonly customColumns = input<any>([]);
  readonly reOrderWidth = input<string>("50px");
  readonly reOrderTextAlign = input<TextAlignType>("center");
  readonly reorderable = input<boolean>(false);

  readonly dataStateChange = output<any>();
  readonly onChange = output<any>();
  readonly refreshBtnClick = output<void>();  
  readonly onReorder = output<FlexiGridReorderModel>();

  columnsArray = signal<FlexiGridColumnComponent[]>([]);

  @Input()
  set pageSize(value: number) {
    if (value !== this._pageSize) {
      this._pageSize = value;
      this.changePageSize({ target: { value: value } });
    }
  }

  get pageSize(): number {
    return this._pageSize;
  }

  pageNumberCount = signal<number>(5);
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

  private _pageSize: number = 10;



  readonly columns = contentChildren(FlexiGridColumnComponent, {descendants: true});
  
  readonly filterTr = viewChild<ElementRef<HTMLTableRowElement>>("filterTr");
  readonly tbody = viewChild<ElementRef>("tbody");

  resizingColumn: any;
  startX: number | undefined;
  startWidth: number | undefined;
  isShowMobileFilter = signal<boolean>(false);

  #cdr = inject(ChangeDetectorRef);  
  #http = inject(HttpClient);

  getColumns(){    
    return [...this.customColumns(), ...this.columns() ]
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.data.length > 0) {
      const columns = this.getColumns();
      if (!columns || columns.length === 0) {
        this.initializeColumnsFromData();
        this.#cdr.detectChanges();
      }
    }

    if (this.pageable()) {
      this.setPageNumbers();
      this.updatePagedData();
    } else {
      this.pagedData.set(this.data);
    }
  }

  ngAfterViewInit(): void {
    const columns = this.getColumns();
    if (!columns || columns.length === 0) {
      this.initializeColumnsFromData();
      this.#cdr.detectChanges();
    }

    columns?.forEach((column:any) => {
      if (column.filterValue != undefined) {
        this.filter(column.field, column.filterOperator, column.filterValue, column.filterType());
      }
    });    
  }
 
  giveFilterValueByFilterType(filterType: string) {
    switch (filterType) {
      case "text":
        return this.textFilterTypes();

      case "number":
        return this.numberFilterTypes();

      default:
        return [];
    }
  }

  showFilterButton(filterType: string) {
    switch (filterType) {
      case "text":
        return true;

      case "number":
        return true;

      default:
        return false;
    }
  }

  initializeColumnsFromData(): void {
    const data = this.data;
    if (data && data.length > 0) {
      const firstItem = data[0];
      const columnsArray = Object.keys(firstItem).map(key => {
        let column:any = {
          field: key,
          title: this.capitalizeFirstLetter(key),
          visible: true,
          hideOverflow: true,
        };
        return column;
      });    
      
      this.columnsArray.set(columnsArray);
    }
  }

  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
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
    const previousGroup = Math.floor((previousPageNumber - 1) / this.pageNumberCount());
    const currentGroup = Math.floor((pageNumber - 1) / this.pageNumberCount());

    if (currentGroup > previousGroup) {
      this.nextPageGroup();
    } else if (currentGroup < previousGroup) {
      this.previousPageGroup();
    } else {
      this.setPageNumbers();
    }

    this.updatePagedData();
  }

  setPageNumbers() {
    const pageCount = Math.ceil(this.total! / +this.state.pageSize);
    const numbers = [];

    // Calculate the current range of page numbers
    const currentGroup = Math.floor((this.state.pageNumber - 1) / this.pageNumberCount());
    const startPage = currentGroup * this.pageNumberCount() + 1;
    const endPage = Math.min(startPage + (this.pageNumberCount() - 1), pageCount);

    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }

    this.pageNumbers.set(numbers);
    this.totalPageCount.set(pageCount);
  }

  nextPageGroup() {
    const pageCount = Math.ceil(this.total! / +this.state.pageSize);
    const currentGroup = Math.floor((this.state.pageNumber - 1) / this.pageNumberCount());
    const nextGroupStartPage = (currentGroup + 1) * this.pageNumberCount() + 1;

    if (nextGroupStartPage <= pageCount) {
      this.state.pageNumber = nextGroupStartPage;
    }

    this.setPageNumbers();
    this.updatePagedData();
  }

  previousPageGroup() {
    const currentGroup = Math.floor((this.state.pageNumber - 1) / this.pageNumberCount());
    const previousGroupStartPage = (currentGroup - 1) * this.pageNumberCount() + 1;

    if (previousGroupStartPage > 0) {
      this.state.pageNumber = previousGroupStartPage;
    }

    this.setPageNumbers();
    this.updatePagedData();
  }

  changePageSize(event: any) {
    const value = +event.target.value;
    this.pageSize = value;
    this.state.pageSize = value;
    this.state.pageNumber = 1;
    this.state.skip = 0;
    if (this.pageable() && this.dataBinding()) {
      this.dataStateChange.emit(this.state);
    } else {
      this.updatePagedData();
    }
  }

  updatePagedData() {
    let filteredData = this.data;

    if (!filteredData) {
      this.pagedData.set([]);
      return;
    }

    const dataBinding = this.dataBinding();
    if (this.filterable() && this.state.filter.length > 0 && !dataBinding) {
      const filters = this.state.filter.filter(p => p.value != undefined);

      filters.forEach((filter) => {
        filteredData = filteredData.filter(item => {
          const field = filter.field;
          const value = filter.value;
          let itemValue = item[field];
          let filterValue: any = value;
          if (filter.type !== "boolean" && filter.type !== "select" && filter.type !== "number") {
            itemValue = itemValue ? itemValue.toString().toLocaleLowerCase('tr') : '';
            filterValue = value ? value.toString().toLocaleLowerCase('tr') : '';
          } else if (filter.type === "boolean" || filter.type === "select") {
            filterValue = value == "true" ? true : false;
          } else if (filter.type === "number") {
            filterValue = +value.toString().replace(",", ".");
          }

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
    if (this.sortable() && this.state.sort.field && !dataBinding) {
      filteredData = filteredData.sort((a, b) => {
        const field = this.state.sort.field;
        const dir = this.state.sort.dir === 'asc' ? 1 : -1;
        if (a[field] < b[field]) return -1 * dir;
        if (a[field] > b[field]) return 1 * dir;
        return 0;
      });
    }

    if (!dataBinding) {
      this.total = filteredData.length;
      this.setPageNumbers();
    }

    // Pagination logic
    if (filteredData) {
      if (filteredData.length > +this.state.pageSize && !dataBinding && this.pageable()) {
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

    if (this.dataBinding()) {
      this.dataStateChange.emit(this.state);
    } else {
      this.updatePagedData();
    }
  }

  sort(sortable: boolean, column: any) {
    if (!column.sortable() || !sortable) return;

    this.state.sort.field = column.field;
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

  setTextAlignForTh(filterable: boolean, column: any) {
    let className: string = "";
    
    const filter: boolean = (filterable && column.field && column.filterable() && this.showFilterButton(column.filterType()));
    className += filter ? 'flexi-th ' : '';
    if (column.textAlign() === "right") {
      if (filter) className += 'flexi-flex-reverse';
      else className += 'flexi-right';
    }
    else if (column.textAlign() === "center" && !filter) className += "flexi-center"

    return className;
  } 

  toggleFilterDropdown(field: string) {
    this.filterDropdownVisible()[field] = !this.filterDropdownVisible()[field];
  }

  applyFilter(column: FlexiGridColumnComponent, operator: string) {
    this.filterDropdownVisible()[column.field] = false;
    column.filterOperator = operator;
    const filterValue = column.filterValue;
    if (filterValue !== "") {
      this.filter(column.field, operator, filterValue, column.filterType());
    }
  }

  filter(field: string, operator: string, value: string, type: FilterType) {
    if (value.toString() === 'undefined') value = "";

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (value.toString() !== '') {
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

      if (this.dataBinding()) {
        this.dataStateChange.emit(this.state);
      } else {
        this.updatePagedData();
      }
    }, this.dataBinding() ? 500 : 1);
  }

  showClearFilter(value: any) {
    if (value) return true;
    return false;
  }

  clearFilter(field: string) {
    this.filter(field, "contains", "", "text");
    const column = this.getColumns()?.find((p:any) => p.field === field);
    if (column) {
      column.filterValue = "";
    }

    if (this.dataBinding()) {

    } else {
      this.updatePagedData();
    }
  }

  toggleColumnVisibilityDropdown() {
    this.columnVisibilityDropdownVisible.set(!this.columnVisibilityDropdownVisible())
  }

  refreshDataMethod() {
    this.refreshBtnClick.emit();

    if (!this.dataBinding()) return;

    this.state = new StateModel();
    this.state.pageSize = this.pageSize;
    this.getColumns()?.forEach((val:any) => {
      const filterType = val.filterType();
      if (filterType === "boolean" || filterType === "select") {
        val.filterValue = undefined
      } else {
        val.filterValue = "";
      }

    });
    this.dataStateChange.emit(this.state);
  }

  closeAllDropdowns() {
    for (let i in this.filterDropdownVisible()) {
      this.filterDropdownVisible()[i] = false;
    }
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-menu') && !target.closest('.svg')) {
      this.closeAllDropdowns();
    }

    if (!target.closest('.dropdown-menu') && !target.closest('button')) {
      this.columnVisibilityDropdownVisible.set(false);
    }
  }

  onMouseDown(event: MouseEvent | any, column: any) {
    this.resizingColumn = column;
    this.startX = event.pageX;
    this.startWidth = event.target!.parentElement.offsetWidth;    

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
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedColumnIndex = index;
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    //todo: not working right now!
    // if (this.draggedColumnIndex === undefined) return;
    // let columnsArray = this.columns();

    // const draggedColumn = columnsArray?.[this.draggedColumnIndex];
    // const targetColumn = columnsArray?.[index];

    // if (draggedColumn && targetColumn) {      
    //   columnsArray!.splice(this.draggedColumnIndex, 1);
    //   columnsArray!.splice(index, 0, draggedColumn);
    // }

    // this.draggedColumnIndex = undefined;
  }

  getFieldValue(item: any, field: string) {
    if (!field.includes(".")) {
      const value = item[field];
      return value !== undefined && value !== null ? value : "";
    } else {
      const fields = field.split(".");
      let currentValue = item;

      for (const f of fields) {
        if (currentValue && f in currentValue) {
          currentValue = currentValue[f];
        } else {
          //console.warn(`Field "${f}" not found in item`, item);
          return "";
        }
      }

      return currentValue !== undefined && currentValue !== null ? currentValue : "";
    }
  }

  getBooleanInputValue(item: any, column: FlexiGridColumnComponent, event: any,) {
    const value = event.target.checked;
    const field = column.field;
    if (!field.includes(".")) {
      item[field] = value;
    } else {
      const fields = field.split(".");
      if (fields.length === 2) {
        item[fields[0]][fields[1]] = value;
      }
    }

    column.onChange.emit(item);
  }

  openMobileFilter() {
    this.filterTr()!.nativeElement.classList.add("show");
    this.isShowMobileFilter.set(true);
    this.tbody()!.nativeElement.classList.add("hide");
  }

  closeMobileFilter() {
    this.filterTr()!.nativeElement.classList.remove("show");
    this.isShowMobileFilter.set(false);
    this.tbody()!.nativeElement.classList.remove("hide");
  }

  tdTemplateClassName(column: FlexiGridColumnComponent) {
    let className: string = column.className();

    if (className !== "") className += " ";
    className += column.hideOverflow ? 'text-overflow-hidden' : ''

    return className;
  }

  getTBodyStyle() {
    const style: { [key: string]: any } = {
      ...this.tbodyStyle()
    };
  
    if (!this.autoHeight()) {
      style['max-height'] = `calc(${this.height()} - 50px)`; // Başlık yüksekliğini çıkarın
    }
    if (this.useMinHeight()) {
      style['min-height'] = this.minHeight();
    }
    return style;
  }

  trackByFn() {
    return 'id-' + (Date.now() * Math.random());
  }

  calculateColspan(): number {
    const columns = this.getColumns();
    const columnsCount = columns ? columns.length : 0;
    const indexCount = this.showIndex() ? 1 : 0;
    const commandCount = this.showCommandColumn() ? 1 : 0;
    const total = columnsCount + indexCount + commandCount;
    return total > 0 ? total : 1; // En az 1 olmasını sağlar
  }

  getSortState(column: string): string {
    if (this.state.sort.field === column) {
      return this.state.sort.dir === 'asc' ? 'ascending' : 'descending';
    }
    return 'none';
  }

  getSortIcon(column: any): string {
    debugger
    if (this.state.sort.field === column.field) {
      return this.state.sort.dir === 'asc' ? '↑' : '↓';
    }
    return '';
  }

  async onExportExcelButtonClick() {
    const exportExcelButtonClick = this.exportExcelButtonClick();
    if (exportExcelButtonClick) {
      exportExcelButtonClick();
    } else {
      if (this.dataBinding() && this.dataBindingExportEndpoint()) {
        await this.fetchAllData();
      }
      this.exportExcel();
    }
  }

  async fetchAllData() {
    try {
      const response: any = await this.#http.get(this.dataBindingExportEndpoint()).toPromise();
      
      let fetchedData: any[] = [];
  
      const dataBindingExportPath = this.dataBindingExportPath();
      if (dataBindingExportPath) {
        // Kullanıcının belirttiği yolu kullanarak veriyi al
        fetchedData = this.getNestedProperty(response, dataBindingExportPath);
      } else if (Array.isArray(response)) {
        // Yanıt doğrudan bir dizi ise
        fetchedData = response;
      } else if (typeof response === 'object' && response.hasOwnProperty('data') && Array.isArray(response.data)) {
        // Yanıt bir nesne ve 'data' özelliği bir dizi ise
        fetchedData = response.data;
      }
  
      if (Array.isArray(fetchedData) && fetchedData.length > 0) {
        this.data = fetchedData;
      } else {
        console.error('Geçerli veri bulunamadı');
      }
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    }
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  async exportExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sayfa1');

    const visibleColumns = this.getColumns()?.filter((column:any) => column.visible) || [];

    // Başlıkları ekle
    worksheet.addRow(visibleColumns.map((col:any) => col.title || col.field));

    // Verileri ekle
    this.data.forEach(row => {
      const rowData = visibleColumns.map((col:any) => this.getFieldValue(row, col.field));
      worksheet.addRow(rowData);
    });

    // Stil ayarları
    worksheet.getRow(1).font = { bold: true };
    visibleColumns.forEach((col: any, index: number) => {
      const column = worksheet.getColumn(index + 1);
      column.width = 15;
      const textAlign = col.textAlign();
      if (textAlign === 'right') {
        column.alignment = { horizontal: 'right' };
      } else if (textAlign === 'center') {
        column.alignment = { horizontal: 'center' };
      }
    });

    // Excel dosyasını oluştur ve indir
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${this.exportExcelFileName()}.xlsx`);
  }

  drop(event: CdkDragDrop<string[]>) {
    const data: FlexiGridReorderModel = {
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    }

    this.onReorder.emit(data);    
  }
}