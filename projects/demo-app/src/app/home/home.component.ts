import { Component } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BlankComponent, CardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
