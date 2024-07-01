import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild, ViewEncapsulation, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

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
 
  @Output("selectedEvent") selectedEvent = new EventEmitter<any>();

  @ViewChild("mySelectInput") mySelectInput: ElementRef<HTMLInputElement> | undefined;
  
  private onChange = (value: any) => {};
  private onTouched = () => {};

  totalData = signal<any[]>([]);
  filteredData = signal<any[]>([]);
  selectedItem = signal<any>({});
  isOpen = signal<boolean>(false);
  itemsPerPage = signal<number>(30);
  clientHeight = signal<number>(180);

  ngOnChanges(changes: SimpleChanges): void {
    this.filteredData.set(changes["data"].currentValue.splice(0,this.itemsPerPage()));    
    this.selectFirstOne();
  }

  loadMoreData() {
    const newData = this.data.slice((this.filteredData().length - 1), (this.filteredData().length + this.itemsPerPage()));
    this.filteredData.set([...this.filteredData(), ...newData]);
    this.clientHeight.set(this.clientHeight() + 180);
  }
    
  onScroll(event: any) {    
    const element = event.target;

    if (element.scrollHeight - element.scrollTop < 200) {
      this.loadMoreData();
    }
  }

  clearAllSelected(){
    this.filteredData().forEach(val => {
      val.isSelected = false;
    });
  }

  selectFirstOne(){
    if(this.filteredData().length === 0){
      return;
    }
    this.clearAllSelected();
    this.filteredData()[0].isSelected = true;
  }

  openOrClose(){
    this.isOpen.set(!this.isOpen());

    if(this.isOpen()){
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
    this.filteredData.set(filtered.slice(0, this.itemsPerPage()));    
    this.selectFirstOne();
  }

  setLiClass(item: any){    
    if(item.isSelected){
      return "my-select-li my-active"
    }

    return "my-select-li"
  } 

  onKeyPress(event: KeyboardEvent) {
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

  select(item:any){    
    this.clearAllSelected();
    item.isSelected = true;
    this.selectedItem.set(item);
    this.isOpen.set(false);
    this.selectedEvent.emit(item);
    this.onChange(item[this.value]);
  }

  writeValue(value: any): void {
    this.selectedItem.set(value);
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
