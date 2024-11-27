import { Component, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FlexiToastOptionsModel, FlexiToastService } from 'flexi-toast';

@Component({
    selector: 'app-toast-test',
    imports: [SharedModule],
    templateUrl: './toast-test.component.html',
    styleUrl: './toast-test.component.css'
})
export default class ToastTestComponent {
  options = signal<FlexiToastOptionsModel>({
    autoClose: true,
    icon: "success",
    position: "bottom-right",
    preventDuplicate: false,
    showToastCloseBtn: true,
    showProgressBar: true,
    themeClass: "light",
    timeOut: 3000,
    swalContentThemeClass: "default",
    confirmBtnText: "Sil",
    cancelBtnText: "Vazgeç"
  });
  toastTitle = signal<string>("Başarılı");
  toastText = signal<string>("Kayıt işlemi başarıyla tamamlandı"); 
  
  constructor(
    private toast: FlexiToastService,
  ){
    this.toast.options = this.options();    
  }

  showToast(){    
    this.toast.showToast(this.toastTitle(), this.toastText(), this.options().icon);
  }
}
