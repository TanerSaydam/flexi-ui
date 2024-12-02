import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FlexiTreeNode, FlexiTreeviewComponent } from 'flexi-treeview';
import { CategoryTreeviewData } from '../../flexi-grid/data';
import { flexiTreeviewData, flexiTreeviewfullExampleHTMLCode, flexiTreeviewfullExampleTSCode } from '../../flexi-grid/code';

@Component({
  selector: 'app-flexi-treeview-full',
  imports: [SharedModule, FlexiTreeviewComponent],
  templateUrl: './full.component.html',  
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class FullTreeViewComponent {    
  treeviewData = signal<FlexiTreeNode[]>(CategoryTreeviewData);
  loading = signal<boolean>(false);  
  fullExampleHTMLCode =signal<string>(flexiTreeviewfullExampleHTMLCode);
  fullExampleTSCode = signal<string>(flexiTreeviewfullExampleTSCode);
  dataCode = signal<string>(flexiTreeviewData)

  onDelete(node: FlexiTreeNode){
    console.log(node);     
  }

  onEdit(node: FlexiTreeNode){
    console.log(node);     
  }

  onRefresh(){
    //getall metodunu çağırıyoruz
  }

  onSelected(selectedNodes: FlexiTreeNode[]){
    console.log(selectedNodes);
  }
}