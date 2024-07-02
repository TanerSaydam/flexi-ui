import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  openOrCloseFlexiGridDropDown = signal(false);
  openOrCloseFlexiSelectDropDown = signal(false);
  themeClass: string = "light";

  constructor() { 
    if(localStorage.getItem("themeColor")){
      this.themeClass = localStorage.getItem("themeClass") ?? "light";
    }
  }
}
