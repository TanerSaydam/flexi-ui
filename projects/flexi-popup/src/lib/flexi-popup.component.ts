import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, ViewEncapsulation, ContentChild } from '@angular/core';
import { FlexiPopupActionTemplateDirective } from './flexi-popup-action-template.directive';

@Component({
  selector: 'flexi-popup',    
  templateUrl: "./flexi-popup.component.html",
  styleUrl: "./flexi-popup.compenent.css",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiPopupComponent {
  @Input() isPopupVisible: boolean = false;
  @Input() popupTitle: string = "";
  @Input() width: string = "500px";
  @Input() height: string = "100%";
  @Input() showActionButtons: boolean = true;
  @Input() themeClass: string = "light";
  @Input() saveBtnText: string = "Kaydet";
  @Input() cancelBtnText: string = "Kapat";
  @Input() saveBtnIcon: string = "save";
  @Input() cancelBtnIcon: string = "block";

  @Output() isPopupVisibleChange = new EventEmitter<boolean>();  
  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<any>();

  @ContentChild(FlexiPopupActionTemplateDirective) actionTemplate?: FlexiPopupActionTemplateDirective;
  
  closePopup() {
    this.isPopupVisible = false;
    this.isPopupVisibleChange.emit(this.isPopupVisible);
  }

  cancel() {
    this.onCancel.emit(); 
  }

  saveChanges() {
    this.onSave.emit(); 
  }
}
