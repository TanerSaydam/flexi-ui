import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { CardComponent } from '../blank/card/card.component';
import { BlankComponent } from '../blank/blank.component';
import { FlexiToastOptionsModel, FlexiToastService } from 'flexi-toast';
import { FormsModule } from '@angular/forms';
import { MyCodeComponent } from '../my-code/my-code.component';
import { SharedService } from '../shared.service';
import { ActivatedRoute } from '@angular/router';

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
export class FlexiToastComponent implements OnDestroy {  
  options = signal<FlexiToastOptionsModel>({
    autoClose: true,
    icon: "success",
    position: "bottom-right",
    preventDuplicate: false,
    showCloseBtn: true,
    showProgressBar: true,
    themeClass: "light",
    timeOut: 3000,
    swalContentThemeClass: "error",
    confirmBtnText: "Sil",
    cancelBtnText: "Vazgeç"
  });
  toastTitle = signal<string>("Başarılı");
  toastText = signal<string>("Kayıt işlemi başarıyla tamamlandı");
  swalTitle = signal<string>("Sil?");
  swalText = signal<string>("Kaydı silmek istiyor musunuz?");
  angularJSONCode = signal<string>(`{
    "styles": [
        "./node_modules/flexi-toast/src/flexi-toast.css"
    ]
}`)
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
  
  constructor(
    private toast: FlexiToastService,
    private route: ActivatedRoute, 
    private shared: SharedService
  ){
    this.toast.options = this.options();
    this.shared.openOrCloseFlexiToastDropDown.set(true);
  }

  ngOnDestroy(): void {
    this.shared.openOrCloseFlexiToastDropDown.set(false);
  }

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      this.scrollToElement(fragment);
    });
  }

  scrollToElement(fragment: string | null): void {
    if (fragment) {
      const element = document.getElementById(fragment);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
  
  showToast(){    
    this.toast.showToast(this.toastTitle(), this.toastText(), this.options().icon);
  }

  showSwal(){    
    this.toast.showSwal(this.swalTitle(), this.swalText(),()=> {
      //Silme işlemi
      this.toast.showToast("Başarılı", "Silme işlemi başarıyla tamamlandı", "success");
    },"Sil","Vazgeç"); //sondaki Sil ve Vazgeç custom btn isimlendirme. Zorunlu değil. Optionsda ayarlarsanız orayı kullanabiliyorsunuz
  }
}
