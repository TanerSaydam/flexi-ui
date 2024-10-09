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
  @Input() height: string = "500px";
  @Input() showActionButtons: boolean = true;
  @Input() themeClass: string = "light";

  @Output() isPopupVisibleChange = new EventEmitter<boolean>();

  @ContentChild(FlexiPopupActionTemplateDirective) actionTemplate?: FlexiPopupActionTemplateDirective;
  
  closePopup() {
    this.isPopupVisible = false;
    this.isPopupVisibleChange.emit(this.isPopupVisible);
  }

  cancel() {
    // İptal işlemi mantığı
  }

  saveChanges() {
    // Kaydetme işlemi mantığı
  }
}
