import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'flexi-button',
    imports: [CommonModule],
    template: `
    <button class="flexi-button flexi-button-{{btnColor()}}" [type]="btnType()" [disabled]="btnDisabled()">
    <div class="flexi-button-content" [style]="btnStyle()">        
        <span class="material-symbols-outlined flexi-button-size-{{btnSize()}}">
          {{ btnIcon() }}
        </span>
        <span class="flexi-button-text flexi-button-text-size-{{btnSize()}}" [style.padding-left]="btnText() ? '3px' : ''" [style.padding-right]="btnText() ? '5px' : ''">
          {{ btnText() }}
        </span>
    </div>
    </button>
  `,
    styleUrl: './flexi-button.component.css',
    host: { '[attr.data-instance-id]': 'instanceId' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiButtonComponent {
  readonly btnIcon = input.required<string>();
  readonly btnColor = input<FlexiButtonColorType>('default');
  readonly btnSize = input<FlexiButtonSizeType>('default');
  readonly btnText = input<string>('');
  readonly btnStyle = input<string>("");
  readonly btnType = input<FlexiButtonType>("button");
  readonly btnDisabled = input<boolean>(false);
}

export type FlexiButtonColorType = "default" | "primary" | "success" | "danger" | "warning" | "info" | "dark";

export type FlexiButtonSizeType = "default" | "small" | "large"
export type FlexiButtonType = "button" | "submit"
