import { Component, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import { FullComponent } from '../flexi-data-grid/full/full.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BlankComponent, CardComponent, FullComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',  
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent {

}
