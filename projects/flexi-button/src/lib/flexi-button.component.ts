import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'flexi-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="flexi-button flexi-button-{{btnColor}} flexi-button-size-{{btnSize}}">
      <div style="display: flex; gap:3px; align-items: center;">
        <span class="material-symbols-outlined flexi-button-size-{{btnSize}}">{{ icon }}</span>
        <ng-content></ng-content>
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
}

export type FlexiButtonIconType = "" | "delete" | "remove" | "delete_forever" | "refresh" | "add" | "feature_search" | "zoom_in" | "sim_card_download" | "browser_updated" | "file_save" | "filter_list" | "sort" | "order" | "filter_list_off" | "reorder" | "menu" | "sweep" | "check" | "add_shopping_cart" | "shopping_cart" | "print" | "edit" | "swap_horiz" | "chat" | "local_shipping" | "library_add_check" | "sell" | "settings" | "unfold_less" | "unfold_more" | "check_box" | "check_box_outline_blank"

export type FlexiButtonColorType = "default" | "primary" | "success" | "danger" | "warning" | "info" | "dark";

export type FlexiButtonSizeType = "default" | "small" | "large"
