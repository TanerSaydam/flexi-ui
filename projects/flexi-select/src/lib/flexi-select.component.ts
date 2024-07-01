import { Component, ContentChildren, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, QueryList, SimpleChanges, ViewChild, ViewEncapsulation, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FlexiOptionComponent } from './flexi-option.component';

@Component({
  selector: 'flexi-select',
  standalone: true,
  imports: [],
  templateUrl: "./flexi-select.component.html",
  styleUrl: "./flexi-select.component.css",
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FlexiSelectComponent),
      multi: true
    }
  ]
})
export class FlexiSelectComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() value: any;
  @Input() label: any;
  @Input() noData: string = "Kayıt bulunamadı";
  @Input() selectOne: string = "Seçim yapınız";
  @Output("selected") selected = new EventEmitter<any>();

  @ContentChildren(forwardRef(() => FlexiOptionComponent)) options!: QueryList<FlexiOptionComponent>;

  @ViewChild("mySelectInput") mySelectInput: ElementRef<HTMLInputElement> | undefined;

  private onChange = (value: any) => { };
  private onTouched = () => { };

  totalData = signal<any[]>([]);
  filteredData = signal<any[]>([]);
  selectedItem = signal<any>({});
  isOpen = signal<boolean>(false);
  itemsPerPage = signal<number>(50);
  clientHeight = signal<number>(180);
  initialState : any;

  ngOnChanges(changes: SimpleChanges): void {
    this.filteredData.set(changes["data"].currentValue.splice(0, this.itemsPerPage()).map((item:any) => ({
      ...item,
      id: item[this.value]
    })));
    this.selectFirstOne();
    this.selectInitialStateValue();  
  }

  ngAfterContentInit() {
    this.options.changes.subscribe(() => {
      if (this.options && this.options.length) {
        const optionData = this.options.map(option => ({
          value: option.value,
          label: option.viewValue
        }));
        this.data = optionData;
        this.filteredData.set(this.data.slice(0, this.itemsPerPage()).map((item:any) => ({
          ...item,
          id: item[this.value]
        })));
        this.selectFirstOne();
        this.label = "label"
        this.value = "value";
        this.selectInitialStateValue();        
      }
    });
  }

  selectInitialStateValue(){
    if(this.data.length > 0 && this.initialState){
      const val = this.data.find(p=> p[this.value] === this.initialState);
      if(val){
        this.selectedItem.set({[this.label]:val[this.label], [this.value]:val[this.value]});
        this.initialState = undefined;
        this.clearAllSelected();
        val.isSelected = true;
        this.filteredData.update((prev) => [val,...prev]);
      }
    }
  }

  loadMoreData() {
    const val = this.mySelectInput!.nativeElement.value.toString().toLocaleLowerCase("tr");
    let newData = val === "" ? this.data : this.data.filter(p => p[this.label].toString().toLocaleLowerCase("tr").includes(val));
    newData = newData.slice((this.filteredData().length - 1), (this.filteredData().length + this.itemsPerPage())).map((item:any) => ({
      ...item,
      id: item[this.value]
    }));
    this.filteredData.set([...this.filteredData(), ...newData]);
    this.clientHeight.set(this.clientHeight() + 180);
  }

  onScroll(event: any) {
    const element = event.target;

    if (element.scrollHeight - element.scrollTop < 200) {
      this.loadMoreData();
    }
  }

  clearAllSelected() {
    this.filteredData().forEach(val => {
      val.isSelected = false;
    });
  }

  selectFirstOne() {
    if (this.filteredData().length === 0) {
      return;
    }
    this.clearAllSelected();
    this.filteredData()[0].isSelected = true;
  }

  openOrClose() {
    this.isOpen.set(!this.isOpen());

    if (this.isOpen()) {
      setTimeout(() => {
        this.mySelectInput?.nativeElement.focus();
      }, 100);
    }
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.my-select')) {
      this.isOpen.set(false);
    }
  }

  search() {
    const val = this.mySelectInput!.nativeElement.value.toString().toLocaleLowerCase("tr");
    const filtered = this.data.filter(p => p[this.label].toString().toLocaleLowerCase("tr").includes(val));
    this.filteredData.set(filtered.slice(0, this.itemsPerPage()).map((item:any) => ({
      ...item,
      id: item[this.value]
    })));
    this.selectFirstOne();
  }

  setLiClass(item: any) {
    if (item.isSelected) {
      return "my-select-li my-active"
    }

    return "my-select-li"
  }

  onKeyDown(event: KeyboardEvent) {
    const currentIndex = this.filteredData().findIndex(item => item.isSelected);

    if (event.key === 'Enter') {
      event.preventDefault();
      if (currentIndex !== -1) {
        this.select(this.filteredData()[currentIndex]);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (currentIndex < this.filteredData().length - 1) {
        this.clearAllSelected();
        this.filteredData()[currentIndex + 1].isSelected = true;
        this.scrollToElement(currentIndex + 1);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (currentIndex > 0) {
        this.clearAllSelected();
        this.filteredData()[currentIndex - 1].isSelected = true;
        this.scrollToElement(currentIndex - 1);
      }
    }
  }

  scrollToElement(index: number) {
    const ulElement = document.querySelector('.my-select-ul') as HTMLElement;
    const liElement = ulElement.children[index] as HTMLElement;
    liElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  select(item: any) {
    this.clearAllSelected();
    item.isSelected = true;
    this.selectedItem.set(item);
    this.isOpen.set(false);
    this.selected.emit(item[this.value]);
    this.onChange(item[this.value]);
    this.mySelectInput!.nativeElement.value = "";    
    this.filteredData.set(this.data.slice(0, this.itemsPerPage()).map(item => ({
      ...item,
      id: item[this.value]
    })));
    this.selectFirstOne();
  }

  selectOption(option: FlexiOptionComponent) {
    const selectedItem = {
      [this.value]: option.value,
      [this.label]: option.viewValue
    };
    this.select(selectedItem);
  }

  writeValue(value: any): void {
    this.selectedItem.set(this.data.find(item => item[this.value] === value) || {});
    if(value){
      this.initialState = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Implement if needed
  }
}
