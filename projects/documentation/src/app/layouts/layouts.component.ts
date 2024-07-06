import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SharedService } from '../shared.service';
import { flexiGridDocument, flexiSelectDocument, flexiToastDocument } from '../document';

@Component({
  selector: 'app-layouts',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layouts.component.html',
  styleUrl: './layouts.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class LayoutsComponent {  
  flexiGridDocument = flexiGridDocument;
  flexiSelectDocument = flexiSelectDocument;
  flexiToastDocument = flexiToastDocument;

  constructor(
    public shared: SharedService
  ){
    if(localStorage.getItem("themeClass")){
      this.shared.themeClass = localStorage.getItem("themeClass") ?? "light";
      localStorage.setItem("themeClass", this.shared.themeClass);
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
}
