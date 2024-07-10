import { Component, ContentChildren, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, QueryList, SimpleChanges, ViewChild, ViewEncapsulation, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FlexiOptionComponent } from './flexi-option.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'flexi-select',
  standalone: true,
  imports: [CommonModule],
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
  @Input() themeClass: string = "light";
  @Input() itemsPerPage : number = 30;
  @Input() clientHeight : number = 180;
  @Input() multiple : boolean = false;
  @Input() closeAfterSelect : boolean = true;
  @Input() height: string = "100%";
  @Output("selected") selected = new EventEmitter<any>();  

  @ContentChildren(forwardRef(() => FlexiOptionComponent)) options!: QueryList<FlexiOptionComponent>;

  @ViewChild("flexiSelectInput") flexiSelectInput: ElementRef<HTMLInputElement> | undefined;

  private onChange = (value: any) => {};
  private onTouched = () => { };

  filteredData = signal<any[]>([]);
  selectedItem = signal<any>({});
  selectedItems = signal<any[]>([]);
  isOpen = signal<boolean>(false);
  initialState : any;

  ngOnChanges(changes: SimpleChanges): void {    
    this.filteredData.set(this.data.slice(0, this.itemsPerPage));    
    
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
        this.filteredData.set(this.data.slice(0, this.itemsPerPage));
        this.selectFirstOne();
        this.label = "label"
        this.value = "value";
        this.selectInitialStateValue();        
      }
    });
  }

  selectInitialStateValue(){
    if(this.data.length > 0 && this.initialState){      
      if(this.multiple){
        this.clearAllSelected();        
        this.selectedItems.set([]);
        const list = [];
        for(const val of this.initialState){
          const d = this.data.find(p=> p[this.value] === val);
          d.isSelected = true;

          const item = {
            [this.label]: d[this.label],
            [this.value]: val
          };

          list.push(item);
        }
        this.selectedItems.set(list);        
        this.initialState = undefined;
      }else{
        const val = this.data.find(p=> p[this.value] === this.initialState);
        if(val){
          this.clearAllSelected();        
          this.selectedItem.set({[this.label]:val[this.label], [this.value]:val[this.value]});
          val.isSelected = true;
          const findValue = this.filteredData().find(p=> p[this.value] === val);
          this.initialState = undefined;
          if(findValue){
            findValue.isSelected = true;
          }
        }
      }
      
    }
  }

  loadMoreData() {
    const val = this.flexiSelectInput!.nativeElement.value.toString().toLocaleLowerCase("tr");
    let newData = val === "" ? this.data : this.data.filter(p => p[this.label].toString().toLocaleLowerCase("tr").includes(val));
    newData = newData.slice((this.filteredData().length - 1), (this.filteredData().length + this.itemsPerPage));
    this.filteredData.set([...this.filteredData(), ...newData]);
    this.clientHeight = this.clientHeight + 180;
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
        this.flexiSelectInput?.nativeElement.focus();
      }, 100);
    }
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.flexi-select')) {
      this.isOpen.set(false);
    }
  }

  search() {
    const val = this.flexiSelectInput!.nativeElement.value.toString().toLocaleLowerCase("tr"); 
    const filtered = this.data.filter(p => p[this.label].toString().toLocaleLowerCase("tr").includes(val)).slice(0,this.itemsPerPage);
    this.filteredData.set(filtered);
    if(!this.multiple){
      this.selectFirstOne();
    }    
  }

  setLiClass(item: any) {
    if (item.isSelected) {
      return "flexi-select-li flexi-active"
    }

    return "flexi-select-li"
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
    const ulElement = document.querySelector('.flexi-select-ul') as HTMLElement;
    const liElement = ulElement.children[index] as HTMLElement;
    liElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  selectForMultiple(item: any) {     
     const selectedItem = {
      [this.label]: item[this.label],
      [this.value]: item[this.value]
    };
    
    if(this.selectedItems().length === 0){
      this.clearAllSelected();
    }

    
    const existingIndex = this.selectedItems().findIndex(existingItem => existingItem[this.value] === selectedItem[this.value]);

    if (existingIndex > -1) {        
        item.isSelected = false;
        this.selectedItems.update(prev => {
            const updatedItems = [...prev];
            updatedItems.splice(existingIndex, 1);
            return updatedItems;
        });
    } else {        
        item.isSelected = true;
        this.selectedItems.update(prev => [...prev, selectedItem]);
    }    
    
    if(this.closeAfterSelect){
      this.isOpen.set(false);
    }
    
    const selectedItemsForNgModel = this.selectedItems().map(val => val[this.value]);
    this.selected.emit(selectedItemsForNgModel);
    this.onChange(selectedItemsForNgModel);
    
    this.flexiSelectInput!.nativeElement.select();
  }

  selectSingle(item:any){
    this.clearAllSelected();
    item.isSelected = true;
    this.selectedItem.set(item);
    if(this.closeAfterSelect){
      this.isOpen.set(false);
    }
    this.selected.emit(item[this.value]);
    this.onChange(item[this.value]);
    this.flexiSelectInput!.nativeElement.select();
  }

  select(item: any) {
    if(this.multiple){
      this.selectForMultiple(item);
    }else{
      this.selectSingle(item);
    }    
  }

  selectOption(option: FlexiOptionComponent) {
    const selectedItem = {
      [this.value]: option.value,
      [this.label]: option.viewValue
    };
    this.select(selectedItem);
  }

  writeValue(value: any): void {    
    if(value){
      this.initialState = value;
      this.selectInitialStateValue();
    } else {
      this.selectedItem.set({});
      this.selectFirstOne();
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

  removeSelectedItemFromSelectedItems(index: number, item: any){    
    this.selectedItems.update(prev => {
      const updatedItems = [...prev];
      updatedItems.splice(index, 1);
      return updatedItems;
  });

    const existingItem = this.data.find(p => p[this.value] === item[this.value]);
    if(existingItem){
      existingItem.isSelected = false;
    }


    const selectedItemsForNgModel = this.selectedItems().map(val => val[this.value]);
    this.selected.emit(selectedItemsForNgModel);
    this.onChange(selectedItemsForNgModel);
    
    this.isOpen.set(true);
  }
}
