import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'flexi-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="flexi-button flexi-button-{{btnColor}} flexi-button-size-{{btnSize}}">
      <div style="display: flex; gap:3px; align-items: center;">
        <span class="material-symbols-outlined">{{ icon }}</span>
        <ng-content></ng-content>
      </div>
    </button>
  `,
  styleUrl: './flexi-button.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiButtonComponent {
  @Input() icon: FlexiButtonIconType = ''; 
  @Input() btnColor: FlexiButtonColorType = 'default';
  @Input() btnSize: FlexiButtonSizeType = 'default';
}

export type FlexiButtonIconType = "" | "delete" | "remove" | "delete_forever" | "refresh" | "add" | "feature_search" | "zoom_in" | "sim_card_download" | "browser_updated" | "file_save" | "filter_list" | "sort" | "order" | "filter_list_off" | "reorder" | "menu" | "sweep" | "check"

export type FlexiButtonColorType = "default" | "primary" | "success" | "danger" | "warning" | "info" | "dark";

export type FlexiButtonSizeType = "default" | "small" | "large";
