import { Directive, ElementRef, HostListener, Renderer2, OnInit, Input } from '@angular/core';

@Directive({
  selector: '[flexiTooltip]',
  standalone: true
})
export class FlexiTooltipDirective implements OnInit {
  @Input('flexiTooltip') tooltipPosition: 'top' | 'bottom' | 'left' | 'right' | '' = 'right';

  private tooltipElement: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    // Tooltip elementini oluştur
    this.tooltipElement = this.renderer.createElement('div');    
    this.renderer.appendChild(this.el.nativeElement, this.tooltipElement);

    // Tooltip stillerini ayarla
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'background-color', '#333');
    this.renderer.setStyle(this.tooltipElement, 'color', '#fff');
    this.renderer.setStyle(this.tooltipElement, 'padding', '4px 10px');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'font-size', '14px');
    this.renderer.setStyle(this.tooltipElement, 'z-index', '10000');
    this.renderer.setStyle(this.tooltipElement, 'display', 'none');
    this.renderer.setStyle(this.tooltipElement, 'white-space', 'nowrap');

    // Tooltip içeriği için bir span oluştur
    const tooltipContent = this.renderer.createElement('span');
    this.renderer.appendChild(this.tooltipElement, tooltipContent);

    // Ok için yeni bir element oluştur
    const arrow = this.renderer.createElement('div');
    this.renderer.appendChild(this.tooltipElement, arrow);    

    this.el.nativeElement.style.position = 'relative';

    // Ok stillerini ayarla
    this.renderer.setStyle(arrow, 'position', 'absolute');
    this.tooltipElement!.style.display = "none";
    this.renderer.setStyle(arrow, 'width', '0');
    this.renderer.setStyle(arrow, 'height', '0');

    this.renderer.appendChild(this.el.nativeElement, this.tooltipElement);
  }

  @HostListener('mouseenter') onMouseEnter() {
    const title = this.el.nativeElement.getAttribute('title');
    if (title) {      
      const tooltipContent = this.tooltipElement!.querySelector('span');
      if (tooltipContent) {
        tooltipContent.textContent = title;
      }

      this.renderer.setStyle(this.tooltipElement, 'display', 'block');
      
      this.el.nativeElement.removeAttribute('title');
      
      this.positionTooltip();

      this.tooltipElement!.style.display = "block";
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltipElement) {      
      const tooltipContent = this.tooltipElement.querySelector('span');
      if (tooltipContent) {
        this.el.nativeElement.setAttribute('title', tooltipContent.textContent || '');
      }

      this.tooltipElement!.style.display = "none";
    }
  }

  private positionTooltip() {
    const elHeight = this.el.nativeElement.getBoundingClientRect().height;
    const elWidth = this.el.nativeElement.getBoundingClientRect().width;
    const tooltipHeight = this.tooltipElement!.getBoundingClientRect().height;
    const tooltipWidth = this.tooltipElement!.getBoundingClientRect().width;    

     if(this.tooltipPosition == ''){
      this.tooltipPosition = 'left';
    }

    let topOrBottomPX = "0px";
    let leftOrRightPX = "0px";

    if(this.tooltipPosition == 'top'){
      topOrBottomPX = ((tooltipHeight + 9) * -1) + "px";
      leftOrRightPX = tooltipWidth > elWidth ? ((tooltipWidth - elWidth ) / 2 * -1) + "px" : "0px";
    }else if(this.tooltipPosition == 'bottom'){
      topOrBottomPX = ((tooltipHeight + 9) * -1) + "px";
      leftOrRightPX = tooltipWidth > elWidth ? ((tooltipWidth - elWidth ) / 2 * -1) + "px" : "0px";
    }else if(this.tooltipPosition == 'left'){      
      topOrBottomPX = (tooltipHeight > elHeight ? ((tooltipHeight - elHeight) / 2) * -1 : (elHeight - tooltipHeight) / 2) + "px";
      leftOrRightPX = ((tooltipWidth + 9) * -1) + "px";
    }else if(this.tooltipPosition == 'right'){
      topOrBottomPX = (tooltipHeight > elHeight ? ((tooltipHeight - elHeight) / 2) * -1 : (elHeight - tooltipHeight) / 2) + "px";
      leftOrRightPX = ((tooltipWidth + 9) * -1) + "px";
    }

    
    const positionLeftOrRight = (this.tooltipPosition === 'left' || this.tooltipPosition === 'right') ? this.tooltipPosition : 'left';
    const positionTopOrBottom = (this.tooltipPosition === 'top' || this.tooltipPosition === 'bottom') ? this.tooltipPosition : 'top';

    this.renderer.setStyle(this.tooltipElement, positionTopOrBottom, topOrBottomPX);
    this.renderer.setStyle(this.tooltipElement, positionLeftOrRight, leftOrRightPX);

    this.updateArrowStyle(this.tooltipPosition);
  }  

  private updateArrowStyle(direction: string) {
    const arrow = this.tooltipElement!.querySelector('div');
    if (arrow) {
      this.renderer.removeStyle(arrow, 'border-left');
      this.renderer.removeStyle(arrow, 'border-right');
      this.renderer.removeStyle(arrow, 'border-top');
      this.renderer.removeStyle(arrow, 'border-bottom');
      this.renderer.removeStyle(arrow, 'top');
      this.renderer.removeStyle(arrow, 'bottom');
      this.renderer.removeStyle(arrow, 'left');
      this.renderer.removeStyle(arrow, 'right');

      switch (direction) {
        case 'top':
          this.renderer.setStyle(arrow, 'bottom', '-5px');
          this.renderer.setStyle(arrow, 'left', '48%');
          this.renderer.setStyle(arrow, 'border-left', '5px solid transparent');
          this.renderer.setStyle(arrow, 'border-right', '5px solid transparent');
          this.renderer.setStyle(arrow, 'border-top', '5px solid #333');
          break;
        case 'bottom':
          this.renderer.setStyle(arrow, 'top', '-5px');
          this.renderer.setStyle(arrow, 'left', '48%');
          this.renderer.setStyle(arrow, 'border-left', '5px solid transparent');
          this.renderer.setStyle(arrow, 'border-right', '5px solid transparent');
          this.renderer.setStyle(arrow, 'border-bottom', '5px solid #333');
          break;
        case 'right':
          this.renderer.setStyle(arrow, 'top', '34%');
          this.renderer.setStyle(arrow, 'left', '-5px');
          this.renderer.setStyle(arrow, 'border-top', '5px solid transparent');
          this.renderer.setStyle(arrow, 'border-bottom', '5px solid transparent');
          this.renderer.setStyle(arrow, 'border-right', '5px solid #333');
          break;
        case 'left':
        case '':
        default:
          this.renderer.setStyle(arrow, 'top', '34%');
          this.renderer.setStyle(arrow, 'right', '-5px');
          this.renderer.setStyle(arrow, 'border-top', '5px solid transparent');
          this.renderer.setStyle(arrow, 'border-bottom', '5px solid transparent');
          this.renderer.setStyle(arrow, 'border-left', '5px solid #333');
          break;
      }
    }
  }
}
