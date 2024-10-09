import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'flexi-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="flexi-button flexi-button-{{btnColor}}">
      <div class="flexi-button-content">
        <span class="material-symbols-outlined flexi-button-size-{{btnSize}}">{{ icon }}</span>
        <span class="flexi-button-text flexi-button-text-size-{{btnSize}}" [style.padding-left]="btnText ? '3px' : ''" [style.padding-right]="btnText ? '5px' : ''">{{ btnText }}</span>
      </div>
    </button>
  `,
  styleUrl: './flexi-button.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiButtonComponent {
  @Input() icon: string = ''; 
  @Input() btnColor: FlexiButtonColorType = 'default';
  @Input() btnSize: FlexiButtonSizeType = 'default';
  @Input() btnText: string = '';
}

export type FlexiButtonColorType = "default" | "primary" | "success" | "danger" | "warning" | "info" | "dark";

export type FlexiButtonSizeType = "default" | "small" | "large"
