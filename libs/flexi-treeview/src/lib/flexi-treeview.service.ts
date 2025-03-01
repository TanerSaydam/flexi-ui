import { Injectable } from '@angular/core';
import { FlexiTreeNode } from './flexi-tree-node.model';

@Injectable({
  providedIn: 'root'
})
export class FlexiTreeviewService {

  convertToTreeNodes<T>(
    data: T[],
    idField: keyof T,
    codeField: keyof T,
    nameField: keyof T,
    descriptionField?: keyof T,
    selectedField?: keyof T,
  ): FlexiTreeNode[] {
    const codeMap = new Map<string, FlexiTreeNode>();

    data.forEach(item => {
      const code = String(item[codeField]);
      let parentNode = codeMap.get(code);
      
      if (!parentNode) {
        parentNode = {
          id: this.generateUniqueId(),
          isMain: true,
          name: code,
          code: code,
          description: '',
          children: [],
          expanded: true,
          selected: false,
          originalData: item,
          indeterminate: false
        };
        codeMap.set(code, parentNode);
      }
      
      const childNode: FlexiTreeNode = {
        id: String(item[idField]),
        isMain: false,
        name: String(item[nameField]),
        code: code,
        description: descriptionField ? String(item[descriptionField]) : '',
        expanded: true,
        selected: selectedField ? Boolean(item[selectedField]) : false,
        originalData: item,
        indeterminate: false
      };

      parentNode.children!.push(childNode);

      this.updateParentSelection(parentNode);
    });
    
    return Array.from(codeMap.values());
  }

  updateParentSelection(parentNode: FlexiTreeNode): void {
    const totalChildren = parentNode.children!.length;
    const selectedChildren = parentNode.children!.filter(child => child.selected).length;

    if (selectedChildren === 0) {
      parentNode.selected = false;
      parentNode.indeterminate = false;
    } else if (selectedChildren === totalChildren) {
      parentNode.selected = true;
      parentNode.indeterminate = false;
    } else {
      parentNode.selected = false;
      parentNode.indeterminate = true;
    }
  }

  generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
