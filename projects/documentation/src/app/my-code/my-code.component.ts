import { AfterViewInit, Component, ViewEncapsulation, input } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var Prism: any;
import 'prismjs';
import 'prismjs/components/prism-typescript';
import { FlexiToastService } from 'flexi-toast';
// import 'prismjs/components/prism-css';
// import 'prismjs/components/prism-javascript';
// import 'prismjs/components/prism-java';
// import 'prismjs/components/prism-markup';
// import 'prismjs/components/prism-sass';
// import 'prismjs/components/prism-scss';
// import 'prismjs/components/prism-ruby';
// import 'prismjs/components/prism-powershell';

@Component({
    selector: 'my-code',
    imports: [CommonModule],
    templateUrl: './my-code.component.html',
    styleUrl: './my-code.component.css',
    encapsulation: ViewEncapsulation.None
})
export class MyCodeComponent implements AfterViewInit {
  readonly language = input<string>("");
  readonly code = input<string>("");
  readonly className = input<string>("my-code");
  constructor(
    private swal: FlexiToastService
  ){}

  ngAfterViewInit(): void {
    Prism.highlightAll();
  }

  copy(){
    navigator.clipboard.writeText(this.code());
    this.swal.showToast("Başarılı","Kod kopyalandı","success");
  }
}
