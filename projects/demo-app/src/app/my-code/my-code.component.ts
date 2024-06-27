import { AfterViewInit, Component, Input, ViewEncapsulation } from '@angular/core';
import { SwalService } from '../swal.service';
import { CommonModule } from '@angular/common';

declare var Prism: any;
import 'prismjs';
import 'prismjs/components/prism-typescript';
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
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-code.component.html',
  styleUrl: './my-code.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class MyCodeComponent implements AfterViewInit {
  @Input() language: string = "";
  @Input() code: string = ""
  @Input() className: string = "my-code";
  constructor(
    private swal: SwalService
  ){}

  ngAfterViewInit(): void {
    Prism.highlightAll();
  }

  copy(){
    navigator.clipboard.writeText(this.code);
    this.swal.callToast("Kod kopyalandı","success");
  }
}
