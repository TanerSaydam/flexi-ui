import { ChangeDetectionStrategy, Component, contentChildren, ContentChildren, EventEmitter, input, output, QueryList, signal, ViewEncapsulation } from '@angular/core';
import { FlexiStepComponent } from '../flexi-step/flexi-step.component';

@Component({
  selector: 'flexi-stepper',
  standalone: false,
  templateUrl: './flexi-stepper.component.html',
  styleUrl: "./flexi-stepper.component.css",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiStepperComponent {
  activeIndex = signal<number>(0);

  readonly completeBtnText = input<string>("Tamamla");
  readonly returnFirstStep = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly checkValidation = input<boolean>(false);
  readonly onComplete = output();

  @ContentChildren(FlexiStepComponent) steps!: QueryList<FlexiStepComponent>;

  private currentStepIsValid(): boolean {
    const stepArray = this.steps.toArray();
    const currentStep = stepArray[this.activeIndex()];
    return currentStep ? currentStep.isValid() ?? true : true;
  }

  nextStep(){
    if (!this.currentStepIsValid() && this.checkValidation()) {      
      return;
    }

    if(this.activeIndex() < this.steps.length - 1){
      this.activeIndex.update(prev => prev + 1);
    }
  }

  prevStep(){
    if(this.activeIndex() > 0){
      this.activeIndex.update(prev => prev - 1);
    }
  }

  complete(){
    if (!this.currentStepIsValid() && this.checkValidation()) {      
      return;
    }

    this.onComplete.emit();
    if(this.returnFirstStep()){
      this.activeIndex.set(0);
    }
  }

  selectStep(index: number){
    if (!this.currentStepIsValid() && this.checkValidation()) {      
      return;
    }

    this.activeIndex.set(index);
  }
}