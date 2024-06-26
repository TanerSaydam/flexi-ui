import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  openOrCloseFlexiGridDropDown = signal(false);
  
  constructor() { }
}
