import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'flexi-grid-column',
  standalone: true,
  imports: [],
  template:''
})
export class FlexiGridColumnComponent {
  @Input() field: string = '';
  @Input() title: string = '';
  @Input() orderable: boolean = true;
  @Input() filterable: boolean = true;
  @Input() visible: boolean = true;
  @Input() filterType: FilterType = "text";
  @Input() columnTempalte: TemplateRef<any> | any;
  @Input() format: DateFormatType | CurrencyFormatType | null = null;

  value: string = "";
  filterOperator: string = "contains";  
}

export type FilterType = "text" | "date" | "date-time" | "number"
export type DateFormatType = 
  "d" | "dd" | "ddd" | "dddd" | // Gün
  "M" | "MM" | "MMM" | "MMMM" | // Ay
  "yy" | "yyyy" | // Yıl
  "h" | "hh" | "H" | "HH" | // Saat
  "m" | "mm" | // Dakika
  "s" | "ss" | // Saniye
  "dd.MM.yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd" | "dd MMMM yyyy" | "MMMM dd, yyyy" |
  "d/M/yyyy" | "d/M/yy" | "dd/MM/yyyy" | "MM/dd/yy" | // Gün/Ay/Yıl
  "yyyy/MM/dd" | "yy/MM/dd" | "yyyy-MM-ddTHH:mm:ss" | "dd-MM-yyyy HH:mm:ss" | // Yıl/Ay/Gün Saat
  "HH:mm:ss" | "hh:mm:ss a" | // Saat/Dakika/Saniye
  "yyyy-MM-ddTHH:mm:ssZ" | "yyyy-MM-ddTHH:mm:ss.SSSZ" | // ISO 8601 formatları
  "MMMM dd, yyyy HH:mm" | "dd MMMM yyyy HH:mm"; // Özel formatlar

  export type CurrencyFormatType = "n0" | "n2"