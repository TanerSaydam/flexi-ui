import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SharedService } from '../shared.service';
import { flexiGridDocument, flexiSelectDocument, flexiToastDocument } from '../document';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({    
    imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslocoModule],
    templateUrl: './layouts.component.html',    
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutsComponent {  
  flexiGridDocument = flexiGridDocument;
  flexiSelectDocument = flexiSelectDocument;
  flexiToastDocument = flexiToastDocument;  

  shared = inject(SharedService);
  transloco = inject(TranslocoService);

  constructor(    
  ){
    if(localStorage.getItem("themeClass")){
      this.shared.themeClass = localStorage.getItem("themeClass") ?? "light";
      localStorage.setItem("themeClass", this.shared.themeClass);
    }

    if(localStorage.getItem("language")){
      const lang = localStorage.getItem("language")!;
      this.transloco.setActiveLang(lang);
    }

    this.changeBodyThemeClass();
  }


  changeTheme(className: string){
    this.shared.themeClass = className;
    localStorage.setItem("themeClass", this.shared.themeClass);
    this.changeBodyThemeClass();
  }

  changeBodyThemeClass(){
    const el = document.querySelector("body");
    el?.setAttribute("data-bs-theme", this.shared.themeClass)
  }

  changeLanguage(lang: string){
    localStorage.setItem("language",lang);
    this.transloco.setActiveLang(lang);
  }
}
