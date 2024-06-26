import { Component } from '@angular/core';
import { CardComponent } from '../blank/card/card.component';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css'
})
export class LoadingComponent {

}
