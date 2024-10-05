import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  themeClass = signal("light");

  constructor() { 
    if(localStorage.getItem("themeSettings")){
      const data = JSON.parse(localStorage.getItem("themeSettings")!);
      if(data.classHolder.includes("dark")){
        this.themeClass.set("dark");
      }else{
        this.themeClass.set("light");
      }
    }
  }
}
