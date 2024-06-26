import { Component, Input } from '@angular/core';
import { SwalService } from '../swal.service';

declare var Prism: any;
import 'prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-powershell';

@Component({
  selector: 'my-code',
  standalone: true,
  imports: [],
  templateUrl: './my-code.component.html',
  styleUrl: './my-code.component.css'
})
export class MyCodeComponent {
  @Input() language: string = "";
  @Input() code: string = ""

  constructor(
    private swal: SwalService
  ){}

  
  ngAfterViewInit() {
    Prism.highlightAll();
  }

  copy(){
    navigator.clipboard.writeText(this.code);
    this.swal.callToast("Kod kopyalandı","success");
  }
}
