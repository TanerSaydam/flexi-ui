import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'flexi-button',
    imports: [CommonModule],
    templateUrl: "./flexi-button.component.html",
    styleUrl: './flexi-button.component.css',
    host: { '[attr.data-instance-id]': 'instanceId' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiButtonComponent {
  readonly btnIcon = input<string | undefined>(undefined);
  readonly btnColor = input<FlexiButtonColorType>('light');
  readonly btnSize = input<FlexiButtonSizeType>('small');
  readonly btnText = input<string | undefined>(undefined);  
  readonly btnType = input<FlexiButtonType>("button");
  readonly btnDisabled = input<boolean>(false);
  readonly firstText = input<boolean>(false);
  readonly btnRounded = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly btnFloat = input<boolean>(false);
  readonly loadingText = input<string | undefined>(undefined);
  readonly btnWidth = input<string | undefined>(undefined);
}

export type FlexiButtonColorType = "light" | "primary" | "success" | "danger" | "warning" | "info" | "dark" | "indigo" | "purple" | "pink" | "teal" | "yellow" | "secondary" | "black" | "white";
export type FlexiButtonSizeType = "small" | "medium" | "large"
export type FlexiButtonType = "button" | "submit"