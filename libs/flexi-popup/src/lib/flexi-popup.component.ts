import { ChangeDetectionStrategy, Component, ViewEncapsulation, output, input, linkedSignal, TemplateRef, contentChild } from '@angular/core';
import { FlexiPopupFooterTemplateDirective } from './flexi-popup-footer-template.directive';

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
  readonly minHeight = input<string>("500px");
  readonly useMinHeight = input<boolean>(true);
  readonly showActionButtons = input<boolean>(true);
  readonly themeClass = input<string>("light");
  readonly saveBtnText = input<string>("Kaydet");
  readonly cancelBtnText = input<string>("Kapat");
  readonly saveBtnIcon = input<string>("save");
  readonly cancelBtnIcon = input<string>("block");
  readonly btnType = input<"submit" | "button">("button");
  readonly loading = input<boolean>(false);

  readonly popupVisibe = linkedSignal(() => this.isPopupVisible());

  readonly isPopupVisibleChange = output<boolean>();
  readonly onSave = output();
  readonly onCancel = output();

  readonly footerTemplate = contentChild(FlexiPopupFooterTemplateDirective, {read: TemplateRef});

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
    const newHeight = heightNumber + 35;

    return newHeight + "px";
  }
}