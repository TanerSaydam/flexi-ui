import { Component, inject } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { RolesData, UsersData } from '../../../../documentation/src/app/flexi-grid/data';
import { FlexiSelectModule } from "../../../../flexi-select/src/lib/flexi-select.module";
import { FlexiTreeviewComponent } from "../../../../flexi-treeview/src/lib/flexi-treeview.component";
import { FlexiTreeviewService } from '../../../../flexi-treeview/src/public-api';
import { FlexiTooltipDirective } from '../../../../flexi-tooltip/src/public-api';


@Component({
    imports: [
    BlankComponent,
    FlexiSelectModule,
    FlexiTreeviewComponent,
    FlexiTooltipDirective
],
    templateUrl: './users.component.html',
    styleUrl: './users.component.css'
})
export class UsersComponent {
  data = RolesData
  treeData:any[] = [];
  #tree = inject(FlexiTreeviewService);

  constructor(){
    this.treeData = this.#tree.convertToTreeNodes(this.data,"id","code","name","description","isSelected");
  }

  onSelected(event:any){
    console.log(event);
    
  }
}