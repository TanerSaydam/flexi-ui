import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, ViewEncapsulation, forwardRef, inject, signal, viewChildren } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FlexiOptionComponent } from './flexi-option.component';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'flexi-select',
  standalone: true,
  imports: [NgStyle],
  templateUrl: "./flexi-select.component.html",
  styleUrl: "./flexi-select.component.css",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FlexiSelectComponent),
      multi: true
    }
  ]
})
export class FlexiSelectComponent implements OnChanges, OnInit {
  @Input() data: any[] = [];
  @Input() value: any;
  @Input() label: any;
  @Input() name: any;
  @Input() noData: string = "Kayıt bulunamadı";
  @Input() selectOne: string = "Seçim yapınız";
  @Input() themeClass: string = "light";
  @Input() itemsPerPage: number = 30;
  @Input() clientHeight: number = 180;
  @Input() multiple: boolean = false;
  @Input() closeAfterSelect: boolean = false;
  @Input() height: string = "100%";
  @Input() tabindex: number = 0;

  @Output("selected") selected = new EventEmitter<any>();

  @ContentChildren(forwardRef(() => FlexiOptionComponent)) options!: QueryList<FlexiOptionComponent>;

  @ViewChild("searchInput") searchInput: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('flexiSelectContainer') flexiSelectContainer!: ElementRef;
  @ViewChild('flexiSelectDiv') flexiSelectDiv!: ElementRef;
  @ViewChild("flexiSelectDropDownDiv") flexiSelectDropDownDiv!: ElementRef;

  private onChange = (value: any) => { };
  private onTouched = () => { };

  filteredData = signal<any[]>([]);
  selectedItem = signal<any>({});
  selectedItems = signal<any[]>([]);
  isOpen = signal<boolean>(false);
  initialState: any;
  uniqueName = signal<string>("");
  closedAfterSelect = signal<boolean>(false);

  #cdr = inject(ChangeDetectorRef);
  #elementRef = inject(ElementRef);
  ngOnChanges(changes: SimpleChanges): void {
    this.filteredData.set(this.data.slice(0, this.itemsPerPage));
    this.selectFirstOne();
    this.selectInitialStateValue();
    this.#cdr.detectChanges();
  }

  ngOnInit(): void {
    this.uniqueName.set(this.name || this.generateUniqueName());
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

  trackByFn() {
    return 'id-' + (Date.now() * Math.random());
  }

  private generateUniqueName(): string {
    return `flexi-select-${Date.now() * Math.random()}`;
  }

  selectInitialStateValue() {
    if (this.data.length > 0 && this.initialState) {
      if (this.multiple) {
        this.clearAllSelected();
        this.selectedItems.set([]);
        const list = [];
        for (const val of this.initialState) {
          const d = this.data.find(p => p[this.value] === val);
          d.isSelected = true;

          const item = {
            [this.label]: d[this.label],
            [this.value]: val
          };

          list.push(item);
        }
        this.selectedItems.set(list);
        this.initialState = undefined;
      } else {
        const val = this.data.find(p => p[this.value] === this.initialState);
        if (val) {
          this.clearAllSelected();
          this.selectedItem.set({ [this.label]: val[this.label], [this.value]: val[this.value] });
          val.isSelected = true;
          const findValue = this.filteredData().find(p => p[this.value] === val);
          this.initialState = undefined;
          if (findValue) {
            findValue.isSelected = true;
          }
        }
      }

    }
  }

  loadMoreData() {
    const val = this.searchInput!.nativeElement.value.toString().toLocaleLowerCase("tr");
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


  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.flexi-select')) {
      this.isOpen.set(false);
    }
  }

  search() {
    const val = this.searchInput!.nativeElement.value.toString().toLocaleLowerCase("tr");
    const filtered = this.data.filter(p => p[this.label].toString().toLocaleLowerCase("tr").includes(val)).slice(0, this.itemsPerPage);
    this.filteredData.set(filtered);
    if (!this.multiple) {
      this.selectFirstOne();
    }
  }

  setLiClass(item: any) {
    if (item.isSelected) {
      return "flexi-select-li flexi-active"
    }

    return "flexi-select-li"
  }

  onFocus() { //odaklandığında        
    /* if(!this.closedAfterSelect()){
      this.isOpen.set(true);
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 100);
    } */
  }

  onBlur() { //odağı kaybettiğinde    
    this.closedAfterSelect.set(false);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
      this.handleAlphabeticInput(event.key.toLowerCase());
    }
  }

  scrollDown() {
    setTimeout(() => {
      const element = this.flexiSelectDropDownDiv.nativeElement;
      const rect = element.getBoundingClientRect();

      const isElementNotFullyVisible = rect.top < 0 || rect.bottom > window.innerHeight;

      if (isElementNotFullyVisible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  handleAlphabeticInput(char: string) {
    if (!this.isOpen()) {
      this.isOpen.set(true);
      setTimeout(() => {
        this.searchInput!.nativeElement.value += char;
        this.searchInput!.nativeElement.focus();
        this.scrollDown();
      }, 100);
    }
  }

  toggleDropdown() {
    this.isOpen.set(!this.isOpen());

    if (this.isOpen()) {
      setTimeout(() => {
        this.searchInput!.nativeElement.focus();
        this.scrollDown();
      }, 100);
    }
  }

  onKeyDownForMainDiv(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      if (!this.isOpen()) {
        this.toggleDropdown();
      }
    } else if (event.code === 'Space') {
      if (this.isOpen()) {
        setTimeout(() => {
          this.searchInput!.nativeElement.focus();
          this.scrollDown();
        }, 100);
      }
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const currentIndex = this.filteredData().findIndex(item => item.isSelected);

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      if (currentIndex !== -1) {
        this.select(this.filteredData()[currentIndex]);
      }
      this.moveToNextElement();
    }
    else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.toggleDropdown();
      }
      if (currentIndex < this.filteredData().length - 1) {
        this.clearAllSelected();
        this.filteredData()[currentIndex + 1].isSelected = true;
        this.scrollToElement(currentIndex + 1);
      }
    }
    else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (currentIndex > 0) {
        this.clearAllSelected();
        this.filteredData()[currentIndex - 1].isSelected = true;
        this.scrollToElement(currentIndex - 1);
      }
    }
    else if (event.key === 'Escape') {
      this.isOpen.set(false);
      this.closedAfterSelect.set(true);
      this.flexiSelectDiv.nativeElement.focus();
    }
    else if (event.key === 'Space') {
      if (!this.isOpen()) {
        this.toggleDropdown();
      }
    }
  }

  moveToNextElement() {
    setTimeout(() => {
      const currentElement = this.#elementRef.nativeElement;
      const nextElement = this.findNextFocusableElement(currentElement);
      if (nextElement) {
        nextElement.focus();
      }
    });
  }

  private findNextFocusableElement(element: HTMLElement): HTMLElement | null {
    const currentTabIndex = this.tabindex;
    const nextTabIndex = currentTabIndex + 1;

    // Tüm belgeyi dolaşarak bir sonraki tabindex'e sahip elementi bul
    const allElements = document.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i] as HTMLElement;
      const elTabIndex = parseInt(el.getAttribute('tabindex') || '-1', 10);

      if (elTabIndex === nextTabIndex && this.isFocusable(el)) {
        return el;
      }
    }

    // Eğer bir sonraki tabindex bulunamazsa, en düşük pozitif tabindex'i bul
    let lowestPositiveTabIndex = Infinity;
    let elementWithLowestTabIndex: HTMLElement | null = null;

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i] as HTMLElement;
      const elTabIndex = parseInt(el.getAttribute('tabindex') || '-1', 10);

      if (elTabIndex > 0 && elTabIndex < lowestPositiveTabIndex && this.isFocusable(el)) {
        lowestPositiveTabIndex = elTabIndex;
        elementWithLowestTabIndex = el;
      }
    }

    return elementWithLowestTabIndex;
  }

  private isFocusable(element: HTMLElement): boolean {
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    return focusableTags.includes(element.tagName) || element.tabIndex >= 0;
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

    if (this.selectedItems().length === 0) {
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

    if (this.closeAfterSelect) {
      this.isOpen.set(false);
    }

    const selectedItemsForNgModel = this.selectedItems().map(val => val[this.value]);
    this.selected.emit(selectedItemsForNgModel);
    this.onChange(selectedItemsForNgModel);

    this.searchInput!.nativeElement.select();
  }

  selectSingle(item: any) {
    this.clearAllSelected();
    item.isSelected = true;
    this.selectedItem.set(item);
    this.isOpen.set(false);
    this.closedAfterSelect.set(false);

    this.selected.emit(item[this.value]);
    this.onChange(item[this.value]);
    this.searchInput!.nativeElement.select();
  }

  select(item: any) {
    if (this.multiple) {
      this.selectForMultiple(item);
      if (this.closeAfterSelect) {
        this.moveToNextElement();
      }
    } else {
      this.selectSingle(item);
      this.moveToNextElement();
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
    if (value) {
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

  removeSelectedItemFromSelectedItems(index: number, item: any) {
    this.selectedItems.update(prev => {
      const updatedItems = [...prev];
      updatedItems.splice(index, 1);
      return updatedItems;
    });

    const existingItem = this.data.find(p => p[this.value] === item[this.value]);
    if (existingItem) {
      existingItem.isSelected = false;
    }


    const selectedItemsForNgModel = this.selectedItems().map(val => val[this.value]);
    this.selected.emit(selectedItemsForNgModel);
    this.onChange(selectedItemsForNgModel);

    this.isOpen.set(true);

    this.scrollDown();
  }


}
