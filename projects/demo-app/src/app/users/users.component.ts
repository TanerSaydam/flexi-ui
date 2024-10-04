import { Component, Renderer2, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SharedService } from '../shared.service';
import { BlankComponent } from '../blank/blank.component';
import { FlexiSelectComponent } from '../../../../flexi-select/src/public-api';
import { FormsModule } from '@angular/forms';
import { FlexiOptionComponent } from '../../../../flexi-select/src/lib/flexi-option.component';
import { FlexiToastService } from '../../../../flexi-toast/src/lib/flexi-toast.service';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/modules/flexi-grid.module';
import { StateModel } from '../../../../flexi-grid/src/lib/models/state.model';
import { FlexiGridFilterDataModel } from '../../../../flexi-grid/src/lib/models/flexi-grid-filter-data.model';
import { FlexiGridService } from '../../../../flexi-grid/src/lib/services/flexi-grid.service';
import { FlexiButtonComponent } from '../../../../flexi-button/src/lib/flexi-button.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    BlankComponent, 
    FlexiGridModule, 
    FlexiSelectComponent, 
    FormsModule, 
    FlexiButtonComponent,
    FlexiOptionComponent,
    FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  users = signal<UserModel[]>([])
  total = signal<number>(0);
  state = signal<StateModel>(new StateModel());
  loading = signal<boolean>(false);
  userId1 = signal<string>("");
  userId2 = signal<string>("");
  selectedItems = signal<string[]>([
    "bf9a87fd-6fca-4210-a57b-000a404d0770",
    "b7d90a7a-0f26-4bf7-90e0-000942c50a4c",
    "5867ac21-4326-4fb0-9329-000d90f3736e"
  ]);
  selectedItem = signal<string>("1b5854a9-d39b-4b8f-b7aa-00a44227ddcc");
  editorContent: string = 'Flexi Grid is loading...';
  filterData: FlexiGridFilterDataModel[] = [
    {
      value: true,
      name: "Active"
    },
    {
      value: false,
      name: "Passive"
    }
  ];
  constructor(
    private http: HttpClient,
    private flexi: FlexiGridService,
    public shared: SharedService,
    public toast: FlexiToastService,
    private renderer: Renderer2
  ){
    //this.state().pageSize = 500;
    this.getAll();
    toast.options.position = "bottom-right";
    toast.options.autoClose = true;
    toast.options.themeClass = "light";
    toast.options.timeOut = 2000;  
    toast.options.swalContentThemeClass = "default"  
    //this.toast.showToast("Error","Something went wrong","error");
    //toast.options.swalContentThemeClass = "info"  
    //toast.options.swalContentThemeClass = "success"  
    //toast.options.swalContentThemeClass = "warning"  
  }


  read(item:any, column:any, rowIndex:any){
  }
  
  onContentChange(content: string) {
    this.editorContent = content;
  }

  showToast(){
    this.toast.showToast("Başarılı","İşlem başarıyla tamamlandı","success");
  }

  changeIds(){
    console.log(this.selectedItems());
    
    // this.selectedItems.set(["bf9a87fd-6fca-4210-a57b-000a404d0770"]);
    // console.log(this.selectedItems());
    
  }

  getAll(){
    //this.users.set(UsersData);    
    this.loading.set(true);
    //const apiUrl = "https://localhost:7040/api";
    const apiUrl = "https://flexi-ui.webapi.ecnorow.com/api";
    let oDataEndpointPart = this.flexi.getODataEndpoint(this.state());
    let endpoint = `${apiUrl}/Users/GetAll?$count=true&${oDataEndpointPart}`;
    //let endpoint = `https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll?$count=true&$top=50`;

    this.http.get<any>(endpoint).subscribe({
      next: (res)=> {      
        this.users.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse)=> {
        this.toast.showToast("Error","Something went wrong","error");
        this.loading.set(false);
      }
    });
  } 

  dataStateChange(event:any){
    this.state.set(event);
    this.getAll();
  }

  exportExcel(){
    this.http.get("https://flexi-ui.webapi.ecnorow.com/api/Users/GetAll").subscribe((res:any)=> {
      this.flexi.exportDataToExcel(res.data, "my-excel");
    })  
  }

  change(event:string){
    //console.log(event);    
  }

  save(){
    // const user1 = this.users().find(p=> p.id === this.userId1());
    // const user2 = this.users().find(p=> p.id === this.userId2());
    // this.userId1.set("");
    this.toast.showToast("Success","Create is successful", "success");
    this.toast.showToast("Info","Update is successful", "info");
    this.toast.showToast("Error","Something went wrong", "error");
    this.toast.showToast("Warning","You need to fix this", "warning");
  } 

  delete(){
    this.toast.showSwal('Sil?',' Lorem ipsum dolor sit amet consectetur?<br>Test 2.satır',()=> {
      this.toast.showToast("Info","Silme işlemi başarıyla tamamlandı", "info");
    });
  }

  showSelected(event:any){
    //console.log(event);
    
  }

  onChange(event:any){
    console.log(event);
    
  }
}

export class UserModel{
  id: string = "";
  firstName: string = "";
  lastName: string = "";
  dateOfBirth: string = "";
  salary: number = 0;
  avatarUrl: string = "";
  isActive: boolean = false;
}