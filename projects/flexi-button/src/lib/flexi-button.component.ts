import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'flexi-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="flexi-button flexi-button-{{btnColor}}" [type]="btnType" [disabled]="btnDisabled"]>
    <div class="flexi-button-content" [style]="btnStyle">        
        <span class="material-symbols-outlined flexi-button-size-{{btnSize}}">
          {{ btnIcon }}
        </span>
        <span class="flexi-button-text flexi-button-text-size-{{btnSize}}" [style.padding-left]="btnText ? '3px' : ''" [style.padding-right]="btnText ? '5px' : ''">
          {{ btnText }}
        </span>
    </div>
    </button>
  `,
  styleUrl: './flexi-button.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiButtonComponent {
  @Input() btnIcon: string = '';
  @Input() btnColor: FlexiButtonColorType = 'default';
  @Input() btnSize: FlexiButtonSizeType = 'default';
  @Input() btnText: string = '';  
  @Input() btnStyle: string = "";
  @Input() btnType: FlexiButtonType = "button";
  @Input() btnDisabled: boolean = false;
}

export type FlexiButtonColorType = "default" | "primary" | "success" | "danger" | "warning" | "info" | "dark";

export type FlexiButtonSizeType = "default" | "small" | "large"
export type FlexiButtonType = "button" | "submit"
