import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-layouts',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './layouts.component.html',
  styleUrl: './layouts.component.css'
})
export class LayoutsComponent {
  constructor(public shared: SharedService){}
}
