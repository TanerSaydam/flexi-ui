import { Component, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FlexiToastOptionsModel, FlexiToastService } from 'flexi-toast';

@Component({
  selector: 'app-toast-use',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './toast-use.component.html',
  styleUrl: './toast-use.component.css'
})
export default class ToastUseComponent {  
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
  title = signal<string>("Başarılı");
  text = signal<string>("Kayıt işlemi başarıyla tamamlandı");

  constructor(
    private toast: FlexiToastService
  ){
    this.toast.options = this.options();
  }

  showToast(){    
    this.toast.showToast(this.title(), this.text(), this.options().icon);
  }`);

  
}
