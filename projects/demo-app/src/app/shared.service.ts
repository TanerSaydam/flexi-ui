import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  themeClass = signal("light");

  constructor() { }
}
