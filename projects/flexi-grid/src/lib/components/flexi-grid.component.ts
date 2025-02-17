import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, TemplateRef, ViewEncapsulation, inject, signal, output, input, contentChildren, viewChild, linkedSignal } from '@angular/core';
import { FilterType, FlexiGridColumnComponent, TextAlignType } from './flexi-grid-column.component';
import { StateFilterModel, StateModel, StateOrderModel } from '../models/state.model';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver-es';
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
  readonly data = input.required<any[]>();
  readonly total = input<number | null>(0);
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
  readonly autoHeight = input<boolean>(false);
  readonly height = input<string>("500px");
  readonly useMinHeight = input<boolean>(true);
  readonly minHeight = input<string>("450px");
  readonly minWidth = input<string>("1050px");
  readonly useMinWidth = input<boolean>(false);
  readonly autoWidth = input<boolean>(true);
  readonly width = input<string>("100%");
  readonly indexWidth = input<string>("45px");     
  readonly exportExcelFileName = input<string>("excel-export");
  readonly exportExcelButtonClick = input<(() => void)>();  
  readonly resizable = input<boolean>(true);  
  readonly tbodyStyle = input<any>({});
  readonly trMinHeight = input<string>("45px");
  readonly showCommandColumn = input<Boolean>(false);
  readonly commandColumnTitle = input<string>("İşlemler");
  readonly commandColumnWidth = input<string>("100px");
  readonly commandColumnTextAlign = input<AlignSetting>("left");
  readonly commandColumnTemplate = input<TemplateRef<any> | any>();
  readonly stickyCommandColumn = input<boolean>(true);
  readonly fontSize = input<string>("13px");
  readonly dataBindingExportEndpoint = input<string>('');
  readonly dataBindingExportPath = input<string>('data');  
  readonly customColumns = input<any>([]);
  readonly reOrderWidth = input<string>("50px");
  readonly reOrderTextAlign = input<TextAlignType>("center");
  readonly reorderable = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly selectableWidth = input<string>("50px");
  readonly selectableTextAlign = input<TextAlignType>("center");
  readonly selectableField = input<string>("");

  readonly columnsArray = signal<FlexiGridColumnComponent[]>([]);
  readonly totalSignal = linkedSignal(()=> this.total());
  readonly dataSignal = linkedSignal(()=> this.data());  
  readonly selectedRows = signal<Set<any>>(new Set());
  readonly allSelected = signal<boolean>(false);

  readonly dataStateChange = output<any>();
  readonly onChange = output<any>();
  readonly onRefresh = output<void>();  
  readonly onReorder = output<FlexiGridReorderModel>();
  readonly onSelected = output<any[]>(); 

  @Input()
  set pageSize(value: number) {
    if (value !== this._pageSize()) {
      this._pageSize.set(value);
      this.changePageSize({ target: { value: value } });
    }
  }

  get pageSize(): number {
    return this._pageSize();
  }

  readonly pageNumberCount = signal<number>(5);
  readonly pageNumbers = signal<number[]>([]);
  readonly totalPageCount = signal<number>(0);
  readonly state = signal<StateModel>(new StateModel());
  readonly pagedData = signal<any[]>([]);  
  timeoutId: any;
  readonly filterDropdownVisible = signal<{ [key: string]: boolean }>({});
  readonly columnVisibilityDropdownVisible = signal(false);
  
  readonly textFilterTypes = signal<{ operator: string, value: string }[]>([
    { operator: "eq", value: 'Eşittir' },
    { operator: "ne", value: 'Eşit değildir' },
    { operator: "contains", value: 'İçerir' },
    { operator: "not contains", value: 'İçermez' },
    { operator: "startswith", value: 'İle başlar' },
    { operator: "endswith", value: 'İle biter' }
  ]);
  readonly numberFilterTypes = signal<{ operator: string, value: string }[]>([
    { operator: "eq", value: 'Eşittir' },
    { operator: "ne", value: 'Eşit değildir' },
    { operator: "gt", value: 'Daha büyüktür' },
    { operator: "ge", value: 'Daha büyüktür ya da eşittir' },
    { operator: "lt", value: 'Daha küçüktür' },
    { operator: "le", value: 'Daha küçüktür ya da eşittir' }
  ]);
  readonly dateFilterTypes = signal<{ operator: string, value: string }[]>([
    { operator: "eq", value: 'Eşittir' },
    { operator: "ne", value: 'Eşit değildir' },
    { operator: "gt", value: 'Sonraki' },
    { operator: "ge", value: 'Sonraki ya da aynı tarih' },
    { operator: "lt", value: 'Önceki' },
    { operator: "le", value: 'Önceki ya da aynı tarih' },
    { operator: "range", value: 'Belirli bir tarih aralığında' }
  ]);

  readonly _pageSize = signal<number>(10);

  readonly columns = contentChildren(FlexiGridColumnComponent, {descendants: true});
  
  readonly filterTr = viewChild<ElementRef<HTMLTableRowElement>>("filterTr");
  readonly tbody = viewChild<ElementRef>("tbody");

  readonly resizingColumn = signal<any>(undefined);
  readonly startX = signal<number | undefined>(undefined);
  readonly startWidth = signal<number | undefined>(undefined);
  readonly isShowMobileFilter = signal<boolean>(false);

  #cdr = inject(ChangeDetectorRef);  
  #http = inject(HttpClient);

  getColumns(){    
    return [...this.customColumns(), ...this.columns() ]
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.dataSignal().length > 0) {
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
      this.pagedData.set(this.dataSignal());
    }
  }

  ngAfterViewInit(): void {
    const columns = this.getColumns();
    if (!columns || columns.length === 0) {
      this.initializeColumnsFromData();
      this.#cdr.detectChanges();
    }

    columns?.forEach((column:any) => {
      if (column.filterValue() != undefined) {        
        this.filter(column.field(), column.filterOperator(), column.filterValue(), column.filterType());
      }
    });    
  }
 
  giveFilterValueByFilterType(filterType: string) {
    switch (filterType) {
      case "text":
        return this.textFilterTypes();

      case "number":
        return this.numberFilterTypes();

      case "date":
        return this.dateFilterTypes();

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

      case "date":
        return true;

      default:
        return false;
    }
  }

  initializeColumnsFromData(): void {
    const data = this.dataSignal();
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
    this.allSelected.set(false);
    
    if (pageNumber > this.totalPageCount()) {
      pageNumber = this.totalPageCount();
    } else if (pageNumber < 1) {
      pageNumber = 1;
    }

    const previousPageNumber = this.state().pageNumber;
    this.state.update(prev => ({
      ...prev,
      pageNumber: +pageNumber,
      skip: (pageNumber - 1) * +this.state().pageSize
    }));    
    this.dataStateChange.emit(this.state());

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
    const pageCount = Math.ceil(this.totalSignal()! / +this.state().pageSize);
    const numbers = [];

    // Calculate the current range of page numbers
    const currentGroup = Math.floor((this.state().pageNumber - 1) / this.pageNumberCount());
    const startPage = currentGroup * this.pageNumberCount() + 1;
    const endPage = Math.min(startPage + (this.pageNumberCount() - 1), pageCount);

    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }

    this.pageNumbers.set(numbers);
    this.totalPageCount.set(pageCount);
  }

  nextPageGroup() {
    const pageCount = Math.ceil(this.totalSignal()! / +this.state().pageSize);
    const currentGroup = Math.floor((this.state().pageNumber - 1) / this.pageNumberCount());
    const nextGroupStartPage = (currentGroup + 1) * this.pageNumberCount() + 1;

    if (nextGroupStartPage <= pageCount) {
      this.state.update((prev)=> ({
        ...prev,
        pageNumber: nextGroupStartPage,
        skip: (nextGroupStartPage - 1) * +this.state().pageSize
      }));
    }    

    this.setPageNumbers();
    if(this.dataBinding()){      
      this.dataStateChange.emit(this.state());
    }else{
      this.updatePagedData();
    }
  }

  previousPageGroup() {
    const currentGroup = Math.floor((this.state().pageNumber - 1) / this.pageNumberCount());
    const previousGroupStartPage = (currentGroup - 1) * this.pageNumberCount() + 1;

    if (previousGroupStartPage > 0) {
      this.state.update((prev)=> ({
        ...prev,
        pageNumber: previousGroupStartPage,
        skip: (previousGroupStartPage - 1) * +this.state().pageSize
      }));
    }

    this.setPageNumbers();
    if(this.dataBinding()){
      this.dataStateChange.emit(this.state());
    }else{
      this.updatePagedData();
    }
  }

  changePageSize(event: any) {    
    const value = +event.target.value;
    this.pageSize = value;
    this.state.update(prev => ({
      ...prev,
      pageSize: value,
      pageNumber: 1,
      skip: 0
    }));
    if (this.pageable() && this.dataBinding()) {      
      this.dataStateChange.emit(this.state());
    } else {
      this.updatePagedData();
    }
  }

  updatePagedData() {
    let filteredData = this.dataSignal();

    if (!filteredData) {
      this.pagedData.set([]);
      return;
    }

    const dataBinding = this.dataBinding();
    if (this.filterable() && this.state().filter.length > 0 && !dataBinding) {
      const filters = this.state().filter.filter(p => p.value != undefined);

      filters.forEach((filter) => {
        filteredData = filteredData.filter(item => {
          const field = filter.field;
          const value = filter.value;
          let itemValue = item[field];
          let filterValue: any = value;
          let filterValue2:any = filter.value2;

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
              if(filter.type === "number"){
                return parseFloat(itemValue) > parseFloat(filterValue);
              }else if(filter.type === "date"){
                return new Date(itemValue) > new Date(filterValue);
              }else{
                return true;
              }
            case 'ge':
              if(filter.type === "number"){
                return parseFloat(itemValue) >= parseFloat(filterValue);
              }else if(filter.type === "date"){
                return new Date(itemValue) >= new Date(filterValue);
              }else{
                return true;
              }              
            case 'lt':
              if(filter.type === "number"){
                return parseFloat(itemValue) < parseFloat(filterValue);
              }else if(filter.type === "date"){
                return new Date(itemValue) < new Date(filterValue);
              }else{
                return true;
              }
            case 'le':
              if(filter.type === "number"){
                return parseFloat(itemValue) <= parseFloat(filterValue);
              }else if(filter.type === "date"){
                return new Date(itemValue) <= new Date(filterValue);
              }else{
                return true;
              }
            case 'range':              
              if (filter.type === "date") {
                const startDate = new Date(filterValue);
                const endDate = new Date(filterValue2);
                return new Date(itemValue) >= startDate && new Date(itemValue) <= endDate;
              } else if (filter.type === "number") {
                return parseFloat(itemValue) >= parseFloat(filterValue) && parseFloat(itemValue) <= parseFloat(filterValue2);
              } else {
                return true;
              }
            default:
              return true;
          }
        });
      });
    }
    
    if (this.sortable() && this.state().sort.field && !dataBinding) {
      filteredData = filteredData.sort((a, b) => {
        const field = this.state().sort.field;
        const dir = this.state().sort.dir === 'asc' ? 1 : -1;
        if (a[field] < b[field]) return -1 * dir;
        if (a[field] > b[field]) return 1 * dir;
        return 0;
      });
    }

    if (!dataBinding) {
      this.totalSignal.set(filteredData.length);
      this.setPageNumbers();      
    }
    
    if (filteredData) {
      if (filteredData.length > +this.state().pageSize && !dataBinding && this.pageable()) {
        const start = this.state().skip;
        const end = start + +this.state().pageSize;
        this.pagedData.set(filteredData.slice(start, end));
      } else {
        this.pagedData.set(filteredData);
      }
    }    
  }

  sortData() {
    this.dataSignal.set(this.dataSignal().sort((a, b) => {
      const field = this.state().sort.field;
      const dir = this.state().sort.dir === 'asc' ? 1 : -1;
      if (a[field] < b[field]) return -1 * dir;
      if (a[field] > b[field]) return 1 * dir;
      return 0;
    }));

    if (this.dataBinding()) {      
      this.dataStateChange.emit(this.state());
    } else {
      this.updatePagedData();
    }
  }

  sort(sortable: boolean, column: any) {
    if (!column.sortable() || !sortable) return;

    const sort = this.state().sort;
    sort.field = column.field();

    this.state.update(prev => ({
      ...prev,
      sort: sort,
      pageNumber: 1
    }));

    if (this.state().sort.dir === "asc") {
      this.state.update(prev => ({
        ...prev,
        sort: {dir: "desc", field: prev.sort.field}
      }))
    } else if (this.state().sort.dir === 'desc') {      
      this.state.update(prev => ({
        ...prev,
        sort: new StateOrderModel()
      }))      
    } else {
      this.state.update(prev => ({
        ...prev,
        sort: {dir: "asc", field: prev.sort.field}
      }));
    }

    this.sortData();
  }

  setTextAlignForTh(filterable: boolean, column: any) {
    let className: string = "";
    
    const filter: boolean = (filterable && column.field() && column.filterable() && this.showFilterButton(column.filterType()));
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
    this.filterDropdownVisible()[column.field()] = false;
    column.filterOperator.set(operator);   

    if(operator === "range"){      
      column.showSecondDate.set(true);

      if(!column.filterValueSignal() || !column.filterValue2Signal()){
        return;
      }
    }else{
      column.showSecondDate.set(false);
    }

    if (column.filterValueSignal() !== "") {
      this.filter(column.field(), operator, column.filterValueSignal(), column.filterType(), column.filterValue2Signal());
    }
  }

  filter(field: string, operator: string, value: string, type: FilterType, value2?: string) {
    if (value === undefined || value.toString() === 'undefined') value = "";
    if (operator === "range" && !value2) return;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (value.toString() !== '') {
        this.state.update(prev => ({
          ...prev,
          pageNumber: 1,
          skip: 0
        }));        
        let filterField = this.state().filter.find(p => p.field === field);
        if (filterField) {
          filterField.value = value;
          filterField.value2= value2 ?? "";
          filterField.operator = operator;
        } else {
          filterField = new StateFilterModel();
          filterField.field = field;
          filterField.operator = operator;
          filterField.value = value;
          filterField.value2 = value2 ?? "";
          filterField.type = type
          const filter = this.state().filter;
          filter.push(filterField);
          this.state.update(prev => ({
            ...prev,
            filter: filter
          }));          
        }
      } else {
        const findIndex = this.state().filter.findIndex(p => p.field === field);

        if (findIndex > -1) {
          this.state().filter.splice(findIndex, 1);
        }
      }

      if (this.dataBinding()) {         
        this.dataStateChange.emit(this.state());
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
    const column = this.getColumns()?.find((p:any) => p.field() === field);    
    if (column) {
      column.filterValueSignal.set("");
      column.filterValue2Signal.set("");
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
    this.onRefresh.emit();

    if (!this.dataBinding()) return;

    this.state.set(new StateModel());
    this.state.update(prev => ({
      ...prev,
      pageSize: this.pageSize
    }))
    this.getColumns()?.forEach((val:any) => {
      const filterType = val.filterType();
      if (filterType === "boolean" || filterType === "select") {
        val.filterValue = undefined
      } else {
        val.filterValue = "";
      }

    });
    this.dataStateChange.emit(this.state());
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

  onMouseDown(event: MouseEvent | any, column: any, width: any) {
    this.resizingColumn.set(column);
    this.startX.set(event.pageX);
    this.startWidth.set(+width.toString().replace("px",""))    

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove = (event: MouseEvent) => {
    if (this.resizingColumn()) {
      const offset = event.pageX - this.startX()!;
      this.resizingColumn().widthSignal.set(this.startWidth()! + offset + 'px');
    }
  }

  @HostListener('document:mouseup')
  onMouseUp = () => {
    this.resizingColumn.set(undefined);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);   
  }  

  getFieldValue(item: any, field: string) {
    try {
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
    } catch (error) {
     console.log(error);     
    }
  }

  getBooleanInputValue(item: any, column: FlexiGridColumnComponent, event: any,) {
    const value = event.target.checked;
    const field = column.field();
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
    className += column.hideOverflow() ? 'text-overflow-hidden' : ''

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
    if (this.state().sort.field === column) {
      return this.state().sort.dir === 'asc' ? 'ascending' : 'descending';
    }
    return 'none';
  }

  getSortIcon(column: any): string {    
    if (this.state().sort.field === column.field()) {
      return this.state().sort.dir === 'asc' ? '↑' : '↓';
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
        this.dataSignal.set(fetchedData);
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

    const visibleColumns = this.getColumns()?.filter((column:any) => column.visible()) || [];

    // Başlıkları ekle
    worksheet.addRow(visibleColumns.map((col:any) => col.title() || col.field()));

    // Verileri ekle
    this.dataSignal().forEach(row => {
      const rowData = visibleColumns.map((col:any) => {
        return this.getFieldValue(row, col.field());
      });
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

  toggleRowSelection(item:any){
    if(!this.selectable()) return;
    
    if(this.selectedRows().has(item)){
      this.selectedRows().delete(item);
    }else{
      this.selectedRows().add(item);
    }

    this.onSelected.emit([...this.selectedRows()]);
  }

  selectAll(): void {
    this.selectedRows().clear();
    if(this.dataBinding()){
      this.pagedData().forEach((item) => {
        this.selectedRows().add(item[this.selectableField()]);
      });

    }else{
      this.data().forEach((item) => {
        this.selectedRows().add(item[this.selectableField()]);
      });      
    }   
    
    this.allSelected.set(true);
  }  
  
  unselectAll(): void {
    this.selectedRows().clear();
    this.allSelected.set(false);
  }  
  
  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.unselectAll();
    } else {
      this.selectAll();
    }

    this.onSelected.emit([...this.selectedRows()]);
  }

  allSelectedWasIndeterminate(): boolean {
    const totalItems = this.dataBinding() ? this.total() ?? this.data().length : this.data().length;
    const selectedItems = this.selectedRows().size;    
    
    return selectedItems > 0 && selectedItems < totalItems;
  }

  checked(item:any){
    const result = this.selectedRows().has(item);
    return result
  }

  clearSelected(){
    this.selectedRows().clear();
  }
}