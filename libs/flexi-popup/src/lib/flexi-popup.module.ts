import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexiPopupComponent } from './flexi-popup.component';
import { FlexiButtonComponent } from 'flexi-button';
import { FlexiPopupFooterTemplateDirective } from './flexi-popup-footer-template.directive';



@NgModule({
  declarations: [
    FlexiPopupComponent,
    FlexiPopupFooterTemplateDirective
  ],
  imports: [
    CommonModule,
    FlexiButtonComponent
  ],
  exports: [
    FlexiPopupComponent,
    FlexiPopupFooterTemplateDirective,
    FlexiButtonComponent
  ]
})
export class FlexiPopupModule { }
