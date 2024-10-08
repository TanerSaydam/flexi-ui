import { Injectable } from '@angular/core';
import { TreeNode } from './flexi-treeview.component';

@Injectable({
  providedIn: 'root'
})
export class FlexiTreeviewService {

  convertToTreeNodes<T>(
    data: T[],
    codeField: keyof T,
    nameField: keyof T,
    descriptionField?: keyof T
  ): TreeNode[] {
    const codeMap = new Map<string, TreeNode>();

    data.forEach(item => {
      const code = String(item[codeField]);
      let parentNode = codeMap.get(code);

      // Eğer bu kod için üst düğüm yoksa, oluştur
      if (!parentNode) {
        parentNode = {
          id: code,
          name: code,
          code: code,
          description: '',
          children: [],
          expanded: true,
          selected: false
        };
        codeMap.set(code, parentNode);
      }

      // Her rol için bir alt düğüm oluştur
      const childNode: TreeNode = {
        id: String(item[nameField]),
        name: String(item[nameField]),
        code: code,
        description: descriptionField ? String(item[descriptionField]) : '',
        expanded: true,
        selected: false
      };

      // Alt düğümü üst düğümün children dizisine ekle
      parentNode.children!.push(childNode);
    });

    // Map değerlerini diziye dönüştür ve döndür
    return Array.from(codeMap.values());
  }
}
