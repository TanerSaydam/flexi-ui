import { Component } from '@angular/core';
import { SharedModule } from '../shared.module';
import ButtonComponent from './button/button.component';

@Component({
  selector: 'app-flexi-button',
  standalone: true,
  imports: [SharedModule, ButtonComponent],
  templateUrl: './flexi-button.component.html',
  styleUrl: './flexi-button.component.css'
})
export default class FlexiButtonComponent {

}
