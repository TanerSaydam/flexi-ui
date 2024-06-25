import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SwalService {

  constructor() { }

  callToast(title: string, icon: SweetAlertIcon = "success"){
    Swal.fire({
      title: title,
      text: "",
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: "bottom-right",
      icon: icon
    });
  }
}

export type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question'