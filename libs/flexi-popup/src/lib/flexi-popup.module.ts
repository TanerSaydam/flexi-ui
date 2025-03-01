import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexiPopupComponent } from './flexi-popup.component';
import { FlexiPopupActionTemplateDirective } from './flexi-popup-action-template.directive';
import { FlexiButtonComponent } from 'flexi-button';



@NgModule({
  declarations: [
    FlexiPopupComponent,
    FlexiPopupActionTemplateDirective
  ],
  imports: [
    CommonModule,
    FlexiButtonComponent
  ],
  exports: [
    FlexiPopupComponent,
    FlexiPopupActionTemplateDirective,
    FlexiButtonComponent
  ]
})
export class FlexiPopupModule { }
