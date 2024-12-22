import { NgModule } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { FlexiStepperComponent } from './components/flexi-stepper/flexi-stepper.component';
import { FlexiStepComponent } from './components/flexi-step/flexi-step.component';

@NgModule({
  declarations: [
    FlexiStepperComponent,
    FlexiStepComponent
  ],
  imports: [
    CommonModule,
    NgTemplateOutlet,    
  ],
  exports: [
    FlexiStepperComponent,
    FlexiStepComponent
  ]
})
export class FlexiStepperModule { }
