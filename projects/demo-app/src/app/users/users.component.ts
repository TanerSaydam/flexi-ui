import { Component, inject } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/modules/flexi-grid.module';
import { RolesData } from '../../../../documentation/src/app/flexi-grid/data';
import { FlexiTreeviewService } from '../../../../flexi-treeview/src/lib/flexi-treeview.service';
import { FlexiTreeNode } from '../../../../flexi-treeview/src/lib/flexi-tree-node.model';


@Component({
    imports: [
    BlankComponent,
    FlexiGridModule    
],
    templateUrl: './users.component.html',
    styleUrl: './users.component.css'
})
export class UsersComponent {
  data = RolesData  
  treeData:FlexiTreeNode[] = [];
  
  #tree = inject(FlexiTreeviewService);

  constructor(){
    this.treeData = this.buildTree(this.data);
  }

  buildTree(data: any[]): FlexiTreeNode[] {
    const tree: FlexiTreeNode[] = [];
    const appMap = new Map<string, FlexiTreeNode>();

    data.forEach(item => {
        const appName = item.applicationName;
        let appNode = appMap.get(appName);

        if (!appNode) {
            appNode = {
                id: appName,
                name: appName,
                code: '',
                isMain: true,
                indeterminate: false,
                children: []
            };
            appMap.set(appName, appNode);
            tree.push(appNode);
        }

        const code = item.code;
        let codeNode = appNode.children!.find(child => child.code === code);

        if (!codeNode) {
            codeNode = {
                id: code,
                name: code,
                code: code,
                isMain: true,
                indeterminate: false,
                children: []
            };
            appNode.children!.push(codeNode);
        }

        const dataNode: FlexiTreeNode = {
            id: item.id,
            name: item.name,
            code: item.code,
            description: item.description,
            isMain: false,
            indeterminate: false,
            originalData: item
        };

        codeNode.children!.push(dataNode);
    });

    return tree;
  }
}