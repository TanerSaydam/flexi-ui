import { Component, Input } from '@angular/core';
import { SwalService } from '../swal.service';

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

  copy(){
    navigator.clipboard.writeText(this.code);
    this.swal.callToast("Kod kopyalandı","success");
  }
}
