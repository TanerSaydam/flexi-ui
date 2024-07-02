import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../../flexi-data-grid/data';
import { MyCodeComponent } from '../../my-code/my-code.component';
import { customOptionTSCode, customOptionHTMLCode } from '../code';
import { FlexiSelectModule } from 'flexi-select';
import { SharedService } from '../../shared.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-custom-option',
  standalone: true,
  imports: [FlexiSelectModule, MyCodeComponent, FormsModule],
  templateUrl: './custom-option.component.html',
  styleUrl: './custom-option.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CustomOptionComponent {
  users = signal<UserModel[]>([]);
  selectedUserId = signal<string>("");
  customOptionTSCode = signal<string>(customOptionTSCode);
  customOptionHTMLCode = signal<string>(customOptionHTMLCode);
  @Input() dataCode = "";

  constructor(
    public shared: SharedService,
    private http: HttpClient
  ){
    this.getAll();
  }

  getAll(){
    let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll`;

    this.http.get(endpoint).subscribe((res:any)=> {
      this.users.set(res.data);
    });
  } 

}
