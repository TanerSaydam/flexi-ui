import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  openOrCloseFlexiGridDropDown = signal(false);
  openOrCloseFlexiSelectDropDown = signal(false);
  openOrCloseFlexiToastDropDown = signal(false);
  themeClass= signal<"light" | "dark">("light");

  constructor() { 
    if(localStorage.getItem("themeColor")){
      const theme = localStorage.getItem("themeClass") ?? "light";
      this.themeClass.set(theme === "light" ? "light" : "dark");
    }
  }
}
