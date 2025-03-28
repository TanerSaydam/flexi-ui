import { Component, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FlexiToastOptionsModel, FlexiToastService } from 'flexi-toast';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-swal-use',
    imports: [SharedModule,TranslocoModule],
    templateUrl: './swal-use.component.html',
    styleUrl: './swal-use.component.css'
})
export default class SwalUseComponent { 
  swalTSCode = signal<string>(`options = signal<FlexiToastOptionsModel>({    
    themeClass: "light",
    cancelBtnText: "Vazgeç"; //Buradan tanımlayabildiğiniz gibi metoda özgü de değiştrebiliyorsunuz
    confirmBtnText: "Sil";//Buradan tanımlayabildiğiniz gibi metoda özgü de değiştrebiliyorsunuz
    swalContentThemeClass: "error";
  });
  title = signal<string>("Sil?");
  text = signal<string>("Kaydı silmek istiyor musunuz?");

  constructor(
    private toast: FlexiToastService
  ){
    this.toast.options = this.options();
  }

  showSwal(){    
    this.toast.showSwal(this.swalTitle(), this.swalText(),()=> {
      //Silme işlemi
      this.toast.showToast("Başarılı", "Silme işlemi başarıyla tamamlandı", "success");
    });
  }`);
}
