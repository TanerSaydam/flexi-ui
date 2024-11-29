import { ChangeDetectionStrategy, Component, ViewEncapsulation, ContentChild, output, input, Input } from '@angular/core';
import { FlexiPopupActionTemplateDirective } from './flexi-popup-action-template.directive';

@Component({
    selector: 'flexi-popup',
    templateUrl: "./flexi-popup.component.html",
    styleUrl: "./flexi-popup.compenent.css",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class FlexiPopupComponent {
  @Input() isPopupVisible: boolean = false;
  readonly popupTitle = input<string>("");
  readonly width = input<string>("500px");
  readonly height = input<string>("100%");
  readonly showActionButtons = input<boolean>(true);
  readonly themeClass = input<string>("light");
  readonly saveBtnText = input<string>("Kaydet");
  readonly cancelBtnText = input<string>("Kapat");
  readonly saveBtnIcon = input<string>("save");
  readonly cancelBtnIcon = input<string>("block");

  readonly isPopupVisibleChange = output<boolean>();  
  readonly onSave = output();
  readonly onCancel = output();

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
