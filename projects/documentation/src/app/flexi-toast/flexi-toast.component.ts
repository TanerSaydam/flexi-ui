import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { CardComponent } from '../blank/card/card.component';
import { BlankComponent } from '../blank/blank.component';
import { FlexiToastOptionsModel, FlexiToastService } from 'flexi-toast';
import { FormsModule } from '@angular/forms';
import { MyCodeComponent } from '../my-code/my-code.component';

@Component({
  selector: 'app-flexi-toast',
  standalone: true,
  imports: [
    BlankComponent, 
    CardComponent, 
    CommonModule,
    FormsModule,
    MyCodeComponent
  ],
  templateUrl: './flexi-toast.component.html',
  styleUrl: './flexi-toast.component.css'
})
export class FlexiToastComponent {  
  options = signal<FlexiToastOptionsModel>({
    autoClose: true,
    icon: "success",
    position: "bottom-right",
    preventDuplicate: false,
    showCloseBtn: true,
    showProgressBar: true,
    themeClass: "light",
    timeOut: 3000
  });
  title = signal<string>("Success");
  text = signal<string>("Create is successfull");
  toastTSCode = signal<string>(`options = signal<FlexiToastOptionsModel>({
    autoClose: true,
    icon: "success",
    position: "bottom-right",
    preventDuplicate: false,
    showCloseBtn: true,
    showProgressBar: true,
    themeClass: "light",
    timeOut: 3000
  });
  title = signal<string>("Success");
  text = signal<string>("Create is successfull");

  constructor(
    private toast: FlexiToastService
  ){
    this.toast.options = this.options();
  }

  showToast(){    
    this.toast.showToast(this.title(), this.text(), this.options().icon);
  }`)
  constructor(
    private toast: FlexiToastService
  ){
    this.toast.options = this.options();
  }

  showToast(){    
    this.toast.showToast(this.title(), this.text(), this.options().icon);
  }
}
