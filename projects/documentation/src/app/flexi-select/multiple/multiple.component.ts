import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../../flexi-data-grid/data';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { multipleTSCode, multipleHTMLCode } from '../code';
import { FlexiSelectModule } from 'flexi-select';
import { SharedService } from '../../shared.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-multiple',
  standalone: true,
  imports: [FlexiSelectModule, MyCodeComponent, FormsModule],
  templateUrl: './multiple.component.html',
  styleUrl: './multiple.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class MultipleComponent {
  users = signal<UserModel[]>(UsersData);
  selectedUserIds = signal<string[]>([
    "5867ac21-4326-4fb0-9329-000d90f3736e",
    "b7d90a7a-0f26-4bf7-90e0-000942c50a4c"
  ]);
  multipleTSCode = signal<string>(multipleTSCode);
  multipleHTMLCode = signal<string>(multipleHTMLCode);
  @Input() dataCode = "";

  constructor(
    public shared: SharedService
  ){}

  selected(event: string){
    console.log(event);    
  }
}
