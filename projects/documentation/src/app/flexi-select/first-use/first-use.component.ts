import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../../flexi-data-grid/data';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { firstUseHTMLCode, firstUseTSCode } from '../code';
import { FlexiSelectModule } from 'flexi-select';
import { SharedService } from '../../shared.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-first-use',
  standalone: true,
  imports: [FlexiSelectModule, MyCodeComponent, FormsModule],
  templateUrl: './first-use.component.html',
  styleUrl: './first-use.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FirstUseComponent {
  users = signal<UserModel[]>(UsersData);
  selectedUserId = signal<string>("");
  firstUseTSCode = signal<string>(firstUseTSCode);
  firstUseHTMLCode = signal<string>(firstUseHTMLCode);
  @Input() dataCode = "";

  constructor(
    public shared: SharedService
  ){}

  selected(event: string){
    console.log(event);    
  }
}
