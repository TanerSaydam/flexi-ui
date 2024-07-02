import { Component, ViewEncapsulation } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { CardComponent } from '../blank/card/card.component';
import FlexiGridFullComponent from '../flexi-data-grid/full/full.component';
import { RouterLink } from '@angular/router';
import FlexiSelectFullComponent from '../flexi-select/full/full.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BlankComponent, CardComponent, FlexiGridFullComponent, RouterLink, FlexiSelectFullComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',  
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent {

}
