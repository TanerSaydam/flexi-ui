import { Component, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FlexiToastOptionsModel, FlexiToastService } from 'flexi-toast';

@Component({
    selector: 'app-swal-test',
    imports: [SharedModule],
    templateUrl: './swal-test.component.html',
    styleUrl: './swal-test.component.css'
})
export default class SwalTestComponent {
  swalTitle = signal<string>("Sil?");
  swalText = signal<string>("Kaydı silmek istiyor musunuz?");
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

  constructor(
    private toast: FlexiToastService,
  ){
    this.toast.options = this.options();    
  }
  
  showSwal(){    
    this.toast.showSwal(this.swalTitle(), this.swalText(),()=> {
      //Silme işlemi
      this.toast.showToast("Başarılı", "Silme işlemi başarıyla tamamlandı", "success");
    },"Sil","Vazgeç"); //sondaki Sil ve Vazgeç custom btn isimlendirme. Zorunlu değil. Optionsda ayarlarsanız orayı kullanabiliyorsunuz
  }
}
