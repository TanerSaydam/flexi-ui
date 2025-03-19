import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FlexiToastService {
  options: FlexiToastOptionsModel = new FlexiToastOptionsModel();

  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);

    this.showSwal("Confirm","Are you sure you want to remove this item?","Yes",() => {

    })
  }

  showToast(title: string, text: string, icon: FlexiToastIconType = "success", options?: FlexiToastOptionsModel) {
    if (!options) {
      options = this.options;
    }

    options.icon = icon;

    let wrapper = document.querySelector(".flexi-toast-wrapper");
    if (!wrapper) {
      wrapper = this.renderer.createElement('div');
      this.renderer.addClass(wrapper, `flexi-toast-wrapper`);
      this.renderer.addClass(wrapper, `flexi-taost-${options.position}`);
      const body = this.renderer.selectRootElement('body', true);
      this.renderer.appendChild(body, wrapper);
    } else {
      wrapper.className = `flexi-toast-wrapper flexi-taost-${options.position}`;

      if (options.preventDuplicate) {
        const allEl: any = document.querySelectorAll(".flexi-toast");
        if (allEl) {
          for (const el of allEl) {
            this.renderer.removeChild(wrapper, el);
          }
        }
      }
    }

    const toast = this.renderer.createElement('div');
    this.renderer.addClass(toast, 'flexi-toast');
    this.renderer.addClass(toast, `flexi-toast-${options.icon}`);
    this.renderer.setAttribute(toast, `data-bs-theme`, options.themeClass!)

    if (!options.showToastCloseBtn) {
      this.renderer.listen(toast, 'click', () => {
        this.renderer.removeClass(toast, 'flexi-toast-fade-in');
        this.renderer.addClass(toast, 'flexi-toast-fade-out');
        setTimeout(() => {
          this.renderer.removeChild(wrapper, toast);
        }, 500);
      });
    }

    const container = this.renderer.createElement('div');
    this.renderer.addClass(container, 'flexi-toast-container');

    const container1 = this.renderer.createElement('div');
    this.renderer.addClass(container1, 'flexi-toast-container-1');

    // SVG ikonu eklemek
    const svgIcon = this.renderer.createElement('svg', 'http://www.w3.org/2000/svg');
    this.renderer.setAttribute(svgIcon, 'xmlns', 'http://www.w3.org/2000/svg');
    this.renderer.setAttribute(svgIcon, 'viewBox', '0 0 512 512');

    const path = this.renderer.createElement('path', 'http://www.w3.org/2000/svg');
    if (options.icon === "success") {
      this.renderer.setAttribute(path, 'd', 'M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zM227.3 387.3l184-184c6.2-6.2 6.2-16.4 0-22.6l-22.6-22.6c-6.2-6.2-16.4-6.2-22.6 0L216 308.1l-70.1-70.1c-6.2-6.2-16.4-6.2-22.6 0l-22.6 22.6c-6.2 6.2-6.2 16.4 0 22.6l104 104c6.2 6.2 16.4 6.2 22.6 0z');
    } else if (options.icon === "warning") {
      this.renderer.setAttribute(path, 'd', 'M504 256c0 137-111 248-248 248S8 393 8 256C8 119.1 119 8 256 8s248 111.1 248 248zm-248 50c-25.4 0-46 20.6-46 46s20.6 46 46 46 46-20.6 46-46-20.6-46-46-46zm-43.7-165.3l7.4 136c.3 6.4 5.6 11.3 12 11.3h48.5c6.4 0 11.6-5 12-11.3l7.4-136c.4-6.9-5.1-12.7-12-12.7h-63.4c-6.9 0-12.4 5.8-12 12.7z');
    } else if (options.icon === "info") {
      this.renderer.setAttribute(path, 'd', 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z');
    } else if (options.icon === "error") {
      this.renderer.setAttribute(path, 'd', 'M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z');
    }

    this.renderer.appendChild(svgIcon, path);
    this.renderer.appendChild(container1, svgIcon);

    const container2 = this.renderer.createElement('div');
    this.renderer.addClass(container2, 'flexi-toast-container-2');

    const titleEl = this.renderer.createElement('span');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);

    const message = this.renderer.createElement('span');
    message.innerHTML = text;

    this.renderer.appendChild(container2, titleEl);
    this.renderer.appendChild(container2, message);

    this.renderer.appendChild(container, container1);
    this.renderer.appendChild(container, container2);

    if (options.autoClose && options.showProgressBar) {
      const progressBar = this.renderer.createElement('div');
      this.renderer.addClass(progressBar, 'flexi-toast-progress-bar');
      this.renderer.addClass(progressBar, `flex-toast-progress-bar-${options.icon}`)
      this.renderer.appendChild(toast, progressBar);

      // Add animation to progress bar
      this.renderer.setStyle(progressBar, 'transition', `width ${options.timeOut}ms linear`);
      this.renderer.setStyle(progressBar, 'width', '100%');
      setTimeout(() => {
        this.renderer.setStyle(progressBar, 'width', '0%');
      }, 10);
    }

    this.renderer.appendChild(toast, container);

    if (options.showToastCloseBtn) {
      const closeBtn = this.renderer.createElement('span');
      this.renderer.addClass(closeBtn, 'flexi-toast-close-btn');
      const closeText = this.renderer.createText('×');
      this.renderer.appendChild(closeBtn, closeText);

      this.renderer.listen(closeBtn, 'click', () => {
        this.renderer.removeClass(toast, 'flexi-toast-fade-in');
        this.renderer.addClass(toast, 'flexi-toast-fade-out');
        setTimeout(() => {
          this.renderer.removeChild(wrapper, toast);
        }, 500);
      });

      this.renderer.appendChild(toast, closeBtn);
    }


    this.renderer.appendChild(wrapper, toast);

    // Timeout to trigger the fade-in animation
    setTimeout(() => {
      this.renderer.addClass(toast, 'flexi-toast-fade-in');
    }, 10);

    if (options.autoClose) {
      setTimeout(() => {
        this.renderer.removeClass(toast, 'flexi-toast-fade-in');
        this.renderer.addClass(toast, 'flexi-toast-fade-out');
        setTimeout(() => {
          this.renderer.removeChild(wrapper, toast);
        }, 500);
      }, options.timeOut);
    }
  }

  showSwal(title: string, question: string, confirmBtnText: string = this.options.confirmBtnText ?? "Delete", callBack: () => void, cancelBtnText: string = this.options.cancelBtnText ?? "Cancel", cancelCallBack?:()=> void) {
    const body = this.renderer.selectRootElement('body', true);

    const container = this.renderer.createElement('div');
    this.renderer.addClass(container, 'flexi-swal-container');
    this.renderer.setAttribute(container, `data-bs-theme`, this.options.themeClass!)

    const content = this.renderer.createElement('div');
    this.renderer.addClass(content, 'flexi-swal-content');
    this.renderer.addClass(content, `flexi-swal-content-left-border-${this.options.swalContentThemeClass}`);

    if(this.options.showSwalCloseBtn){
      const closeBtn = this.renderer.createElement('span');
        this.renderer.addClass(closeBtn, 'flexi-swal-close-btn');
        const closeText = this.renderer.createText('×');
        this.renderer.appendChild(closeBtn, closeText);

        this.renderer.listen(closeBtn, 'click', () => {
          this.renderer.addClass(content, 'fade-out');
          setTimeout(() => {
            this.renderer.removeChild(body, container);
          }, 200);
        });

        this.renderer.appendChild(content, closeBtn);
    }

    const titleEl = this.renderer.createElement("div");
    this.renderer.addClass(titleEl,"flexi-swal-title-container");
    const titleTextEl = this.renderer.createElement("span");
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleTextEl, titleText);
    const titleCloseButton = this.renderer.createElement("button");
    const titleCloseButtonText = this.renderer.createText("x");
    this.renderer.appendChild(titleCloseButton,titleCloseButtonText);
    this.renderer.addClass(titleCloseButton, 'flexi-swal-close-button');
    this.renderer.appendChild(titleEl, titleText);
    this.renderer.appendChild(titleEl, titleCloseButton);
    this.renderer.appendChild(content, titleEl);

    const questionEl = this.renderer.createElement('div');
    this.renderer.addClass(questionEl,"flexi-swal-question-container");
    const questionTextEl = this.renderer.createElement("span");
    const questionText = this.renderer.createText(question);
    this.renderer.appendChild(questionTextEl, questionText);
    this.renderer.appendChild(questionEl,questionTextEl);
    this.renderer.appendChild(content, questionEl);

    const buttonsContainer = this.renderer.createElement('div');
    this.renderer.addClass(buttonsContainer, "flexi-swal-button-container");

    const confirmButton = this.renderer.createElement('button');
    this.renderer.addClass(confirmButton, 'flexi-swal-button');
    this.renderer.addClass(confirmButton, "flexi-swal-button-primary");
    const confirmButtonText = this.renderer.createText(confirmBtnText);
    this.renderer.appendChild(confirmButton, confirmButtonText);

    const cancelButton = this.renderer.createElement('button');
    this.renderer.addClass(cancelButton, 'flexi-swal-button');

    const cancelButtonText = this.renderer.createText(cancelBtnText);
    this.renderer.appendChild(cancelButton, cancelButtonText);

    this.renderer.listen(confirmButton, 'click', () => {
      callBack();
      this.renderer.addClass(content, 'fade-out');
      setTimeout(() => {
        this.renderer.removeChild(body, container);
        this.renderer.removeStyle(body, 'overflow')
        const el = document.getElementsByClassName("flexi-swal-container");
        if(el.length > 0){
          el[0].remove();
        }
      }, 200);
    });

    this.renderer.listen(cancelButton, 'click', () => {
      this.renderer.addClass(content, 'fade-out');
      if(cancelCallBack){
        cancelCallBack();
      }
      setTimeout(() => {
        this.renderer.removeChild(body, container);
        this.renderer.removeStyle(body, 'overflow');
        const el = document.getElementsByClassName("flexi-swal-container");
        if(el.length > 0){
          el[0].remove();
        }
      }, 200);
    });

    this.renderer.appendChild(buttonsContainer, confirmButton);
    this.renderer.appendChild(buttonsContainer, cancelButton);

    this.renderer.appendChild(content, buttonsContainer);

    this.renderer.appendChild(container, content);

    this.renderer.appendChild(body, container);
    this.renderer.setStyle(body, 'overflow', 'hidden');
  }
}

export class FlexiToastOptionsModel {
  icon?: FlexiToastIconType = "success";
  autoClose?: boolean = true;
  timeOut?: number = 3000;
  showProgressBar?: boolean = true;
  showToastCloseBtn?: boolean = true;
  showSwalCloseBtn?: boolean = false;
  preventDuplicate?: boolean = false;
  position?: FlexiToastPositionType = "bottom-right"
  themeClass?: FlexiToastThemeClassType | string = "light";
  cancelBtnText?: string = "Vazgeç";
  confirmBtnText?: string = "Sil";
  swalContentThemeClass?: FlexiSwalContentThemeClass = "default";
}

export type FlexiToastIconType = "success" | "warning" | "info" | "error";
export type FlexiToastThemeClassType = "light" | "dark";
export type FlexiToastPositionType = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "full-bottom" | "full-top";
export type FlexiSwalContentThemeClass = "success" | "warning" | "info" | "error" | "default";