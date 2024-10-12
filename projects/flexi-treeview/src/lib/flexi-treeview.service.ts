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
    descriptionField?: keyof T
  ): FlexiTreeNode[] {
    const codeMap = new Map<string, FlexiTreeNode>();

    data.forEach(item => {
      const code = String(item[codeField]);
      let parentNode = codeMap.get(code);

      // Eğer bu kod için üst düğüm yoksa, oluştur
      if (!parentNode) {
        parentNode = {
          id: String(item[idField]),
          name: code,
          code: code,
          description: '',
          children: [],
          expanded: true,
          selected: false,
          originalData: item
        };
        codeMap.set(code, parentNode);
      }

      // Her rol için bir alt düğüm oluştur
      const childNode: FlexiTreeNode = {
        id: String(item[idField]),
        name: String(item[nameField]),
        code: code,
        description: descriptionField ? String(item[descriptionField]) : '',
        expanded: true,
        selected: false,
        originalData: item
      };

      // Alt düğümü üst düğümün children dizisine ekle
      parentNode.children!.push(childNode);
    });

    // Map değerlerini diziye dönüştür ve döndür
    return Array.from(codeMap.values());
  }
}
