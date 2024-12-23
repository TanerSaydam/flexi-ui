import { ChangeDetectionStrategy, Component, ViewEncapsulation, ContentChild, output, input, Input, signal, linkedSignal } from '@angular/core';
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
  readonly isPopupVisible = input<boolean>(false);
  readonly popupTitle = input<string>("");
  readonly width = input<string>("500px");
  readonly height = input<string>("500px");
  readonly showActionButtons = input<boolean>(true);
  readonly themeClass = input<string>("light");
  readonly saveBtnText = input<string>("Kaydet");
  readonly cancelBtnText = input<string>("Kapat");
  readonly saveBtnIcon = input<string>("save");
  readonly cancelBtnIcon = input<string>("block");
  readonly btnType = input<"submit" | "button">("button");
  readonly loading = input<boolean>(false);
  
  popupVisibe = linkedSignal(() => this.isPopupVisible());

  readonly isPopupVisibleChange = output<boolean>();  
  readonly onSave = output();
  readonly onCancel = output();

  @ContentChild(FlexiPopupActionTemplateDirective) actionTemplate?: FlexiPopupActionTemplateDirective;
  
  closePopup() {
    this.popupVisibe.set(false);
    this.isPopupVisibleChange.emit(this.popupVisibe());
  }

  cancel() {
    this.onCancel.emit(); 
  }

  saveChanges() {
    this.onSave.emit(); 
  }

  calculateContent(){
    const heightNumber = +this.height().replace("px","");
    const newHeight = heightNumber - 125;

    return newHeight + "px";
  }
}
