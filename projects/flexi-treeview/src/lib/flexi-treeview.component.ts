import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexiButtonComponent } from 'flexi-button';
import { FlexiTooltipDirective } from 'flexi-tooltip';

export interface TreeNode {
  id: string;
  name: string;
  code: string;
  description?: string;
  children?: TreeNode[];
  expanded?: boolean;
  selected?: boolean;
}

@Component({
  selector: 'flexi-treeview',
  standalone: true,
  imports: [CommonModule, FormsModule, FlexiButtonComponent, FlexiTooltipDirective],
  templateUrl: "./flexi-treeview.component.html",
  styleUrl: "./flexi-treeview.component.css",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiTreeviewComponent implements OnInit {
  @Input() treeData: TreeNode[] = [];
  @Input() showCheckbox: boolean = true;
  @Input() showEditButton: boolean = false;
  @Input() showDeleteButton: boolean = true;
  @Output() nodeSelected = new EventEmitter<TreeNode>();

  searchTerm: string = '';
  filteredTreeData: TreeNode[] = [];
  foundItemsCount: number = 0;

  ngOnInit() {
    this.filteredTreeData = this.treeData;
  }

  toggleNode(node: TreeNode): void {
    if (node.children && node.children.length) {
      node.expanded = !node.expanded;
    }
  }

  toggleSelection(node: TreeNode, event: Event): void {
    event.stopPropagation();
    node.selected = !node.selected;
    this.nodeSelected.emit(node);
  }

  onSearch() {
    if (this.searchTerm.trim() === '') {
      this.filteredTreeData = this.treeData;
      this.foundItemsCount = 0;
    } else {
      this.filteredTreeData = this.filterNodes(this.treeData, this.searchTerm.toLowerCase());
      this.foundItemsCount = this.countFilteredNodes(this.filteredTreeData);
    }
  }

  filterNodes(nodes: TreeNode[], term: string): TreeNode[] {
    console.log(term.length);
    
    if(term === ''){
      return nodes;
    }
    return nodes.filter(node => {
      const nodeMatches = node.name.toLowerCase().includes(term) || 
                          (node.description && node.description.toLowerCase().includes(term));
      
      if (nodeMatches) {
        return true;
      }

      if (node.children && node.children.length) {
        const filteredChildren = this.filterNodes(node.children, term);
        if (filteredChildren.length) {
          node.children = filteredChildren;
          node.expanded = true;
          return true;
        }
      }

      return false;
    });
  }

  countFilteredNodes(nodes: TreeNode[]): number {
    let count = 0;
    for (const node of nodes) {
      count++; // Her düğümü say
      if (node.children && node.children.length) {
        count += this.countFilteredNodes(node.children); // Alt düğümleri özyinelemeli olarak say
      }
    }
    return count;
  }
}