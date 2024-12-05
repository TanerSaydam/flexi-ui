import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, ElementRef, HostListener, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren, ViewEncapsulation, forwardRef, inject, signal, viewChildren, output, input, viewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FlexiOptionComponent } from './flexi-option.component';
import { NgClass, NgStyle } from '@angular/common';

@Component({
  selector: 'flexi-select',
  standalone: true,
  imports: [NgStyle, NgClass],
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
  @Input() data: any[] = []
  @Input() value: any;
  @Input() label: any;
  readonly name = input<any>();
  readonly noData = input<string>("Kayıt bulunamadı");
  readonly selectOne = input<string>("Seçim yapınız");
  readonly themeClass = input<string>("light");
  readonly itemsPerPage = input<number>(30);
  @Input() clientHeight: number = 180;
  readonly multiple = input<boolean>(false);
  readonly closeAfterSelect = input<boolean>(false);
  readonly height = input<string>("100%");
  readonly tabindex = input<number>(0);

  readonly selected = output<any>({ alias: 'selected' });

  @ContentChildren(forwardRef(() => FlexiOptionComponent)) options!: QueryList<FlexiOptionComponent>;

  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>("searchInput");
  readonly flexiSelectContainer = viewChild.required<ElementRef>('flexiSelectContainer');
  readonly flexiSelectDiv = viewChild.required<ElementRef>('flexiSelectDiv');
  readonly flexiSelectDropDownDiv = viewChild.required<ElementRef>("flexiSelectDropDownDiv");
  readonly flexiSelectUl = viewChild.required<ElementRef>("flexiSelectUl");

  private onChange = (value: any) => { };
  private onTouched = () => { };

  filteredData = signal<any[]>([]);
  selectedItem = signal<any>({});
  selectedItems = signal<any[]>([]);
  isOpen = signal<boolean>(false);
  initialState: any;
  uniqueName = signal<string>("");
  closedAfterSelect = signal<boolean>(false);
  currentHighlightIndex = signal<number>(0);

  #cdr = inject(ChangeDetectorRef);
  #elementRef = inject(ElementRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["data"] && changes["data"].currentValue) {
      this.data = [...changes["data"].currentValue];
      this.addPlaceholderToData();
    }
    this.filteredData.set(this.data.slice(0, this.itemsPerPage()));
    this.currentHighlightIndex.set(0);
    this.selectFirstOne();
    this.selectInitialStateValue();
    this.#cdr.detectChanges();
  }

  ngOnInit(): void {
    this.uniqueName.set(this.name() || this.generateUniqueName());
  }

  ngAfterContentInit() {
    this.options.changes.subscribe(() => {
      if (this.options && this.options.length) {
        const optionData = this.options.map(option => ({
          value: option.value(),
          label: option.viewValue
        }));
        this.data = optionData;
        this.filteredData.set(this.data.slice(0, this.itemsPerPage()));
        this.selectFirstOne();
        this.label = "label"
        this.value = "value";
        this.selectInitialStateValue();
      }
    });
  }

  addPlaceholderToData() {
    const placeholder = { [this.value]: null, [this.label]: this.selectOne() };
    if (!this.data.some(item => item[this.value] === null)) {
      this.data.unshift(placeholder);
    }
  }

  trackByFn() {
    return 'id-' + (Date.now() * Math.random());
  }

  private generateUniqueName(): string {
    return `flexi-select-${Date.now() * Math.random()}`;
  }

  selectInitialStateValue() {
    if (this.data.length > 0 && this.initialState) {
      if (this.multiple()) {
        const list = [];
        for (const val of this.initialState) {
          const d = this.data.find(p => p[this.value] === val);
          if (d) {
            const item = {
              [this.label]: d[this.label],
              [this.value]: val
            };
            list.push(item);
          }
        }
        this.selectedItems.set(list);
        this.initialState = undefined;
      } else {
        const val = this.data.find(p => p[this.value] === this.initialState);
        if (val) {
          this.selectedItem.set({ [this.label]: val[this.label], [this.value]: val[this.value] });
          this.initialState = undefined;
        }
      }
    }
  }

  loadMoreData() {
    const val = this.searchInput()!.nativeElement.value.toString().toLocaleLowerCase("tr");
    let newData = val === "" ? this.data : this.data.filter(p => p[this.label].toString().toLocaleLowerCase("tr").includes(val));
    newData = newData.slice(this.filteredData().length, this.filteredData().length + this.itemsPerPage());
    this.filteredData.set([...this.filteredData(), ...newData]);
    this.clientHeight = this.clientHeight + 180;
  }

  onScroll(event: any) {
    const element = event.target;

    if (element.scrollHeight - element.scrollTop < 200) {
      this.loadMoreData();
    }
  }

  selectFirstOne() {
    if (this.filteredData().length === 0) {
      return;
    }
    if (!this.multiple()) {
      this.selectedItem.set(this.filteredData()[0]);
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
    const val = this.searchInput()!.nativeElement.value.toString().toLocaleLowerCase("tr");
    const filtered = this.data.filter(p => p[this.label].toString().toLocaleLowerCase("tr").includes(val)).slice(0, this.itemsPerPage());
    this.filteredData.set(filtered);
    this.currentHighlightIndex.set(0); // currentHighlightIndex'i sıfırla
    if (!this.multiple()) {
      this.selectFirstOne();
    }
  }

  setLiClass(item: any, index: number) {
    let classes = "flexi-select-li";
    if (this.multiple()) {
      if (this.selectedItems().some(selected => selected[this.value] === item[this.value])) {
        classes += " flexi-active";
      }
    } else {
      if (this.selectedItem() && item[this.value] === this.selectedItem()[this.value]) {
        classes += " flexi-active";
      }
    }
    if (index === this.currentHighlightIndex()) {
      classes += " flexi-highlighted";
    }
    return classes;
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
    if (event.target === this.searchInput()?.nativeElement) {
      return; // Input alanından geliyorsa işlemi sonlandır
    }
    if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
      event.preventDefault();
      this.handleAlphabeticInput(event.key.toLowerCase());
    }
  }

  scrollDown() {
    setTimeout(() => {
      const element = this.flexiSelectDropDownDiv().nativeElement;
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
        const searchInput = this.searchInput();
        searchInput!.nativeElement.value += char;
        searchInput!.nativeElement.focus();
        this.currentHighlightIndex.set(0); // currentHighlightIndex'i sıfırla
        this.scrollDown();
      }, 100);
    }
  }

  toggleDropdown() {
    this.isOpen.set(!this.isOpen());

    if (this.isOpen()) {
      setTimeout(() => {
        this.searchInput()!.nativeElement.focus();
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
          this.searchInput()!.nativeElement.focus();
          this.scrollDown();
        }, 100);
      }
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.toggleDropdown();
      }
      if (this.currentHighlightIndex() < this.filteredData().length - 1) {
        this.currentHighlightIndex.update(index => index + 1);
        this.scrollToElement(this.currentHighlightIndex());
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.currentHighlightIndex() > 0) {
        this.currentHighlightIndex.update(index => index - 1);
        this.scrollToElement(this.currentHighlightIndex());
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.filteredData()[this.currentHighlightIndex()];
      if (item) {
        this.select(item);
      }
      if (!this.multiple()) {
        this.moveToNextElement();
      }
    } else if (event.key === 'Tab') {
      this.moveToNextElement();
      this.isOpen.set(false);
    }
    else if (event.key === 'Escape') {
      this.isOpen.set(false);
      this.closedAfterSelect.set(true);
      this.flexiSelectDiv().nativeElement.focus();
    } else if (event.key === 'Space') {
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
    const currentTabIndex = this.tabindex();
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

  isFocusable(element: HTMLElement): boolean {
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    return focusableTags.includes(element.tagName) || element.tabIndex >= 0;
  }

  scrollToElement(index: number) {
    const ulElement = this.flexiSelectUl().nativeElement;
    const liElement = ulElement.children[index];
    if (liElement) {
      liElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  selectForMultiple(item: any) {
    const selectedItem = {
      [this.label]: item[this.label],
      [this.value]: item[this.value]
    };

    const existingIndex = this.selectedItems().findIndex(existingItem => existingItem[this.value] === selectedItem[this.value]);

    if (existingIndex > -1) {
      this.selectedItems.update(prev => {
        const updatedItems = [...prev];
        updatedItems.splice(existingIndex, 1);
        return updatedItems;
      });
    } else {
      this.selectedItems.update(prev => [...prev, selectedItem]);
    }

    if (this.closeAfterSelect()) {
      this.isOpen.set(false);
    }

    const selectedItemsForNgModel = this.selectedItems().map(val => val[this.value]);
    this.selected.emit(selectedItemsForNgModel);
    this.onChange(selectedItemsForNgModel);

    this.searchInput()!.nativeElement.select();
  }

  selectSingle(item: any) {
    this.selectedItem.set(item);
    this.isOpen.set(false);
    this.closedAfterSelect.set(false);

    const value = this.value;
    this.selected.emit(item[value]);
    this.onChange(item[value]);
    this.searchInput()!.nativeElement.select();
  }

  select(item: any) {
    if (this.multiple()) {
      this.selectForMultiple(item);
      if (this.closeAfterSelect()) {
        this.moveToNextElement();
      }
    } else {
      this.selectSingle(item);
      this.moveToNextElement();
    }

  }

  selectOption(option: FlexiOptionComponent) {
    const selectedItem = {
      [this.value]: option.value(),
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

    const selectedItemsForNgModel = this.selectedItems().map(val => val[this.value]);
    this.selected.emit(selectedItemsForNgModel);
    this.onChange(selectedItemsForNgModel);

    this.isOpen.set(true);

    this.scrollDown();
  }
}