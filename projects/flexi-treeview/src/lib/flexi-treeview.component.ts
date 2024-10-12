import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation, ChangeDetectionStrategy, signal, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexiButtonComponent, FlexiButtonSizeType } from 'flexi-button';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { FlexiTreeNode } from './flexi-tree-node.model';

@Component({
  selector: 'flexi-treeview',
  standalone: true,
  imports: [CommonModule, FormsModule, FlexiButtonComponent, FlexiTooltipDirective],
  templateUrl: "./flexi-treeview.component.html",
  styleUrl: "./flexi-treeview.component.css",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiTreeviewComponent implements AfterViewInit, OnChanges {  
  @Input() data: FlexiTreeNode[] = [];
  @Input() treeviewTitle: string = '';
  @Input() showCheckbox: boolean = false;
  @Input() showEditButton: boolean = true;
  @Input() showDeleteButton: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() showActions: boolean = true;
  @Input() width: string = '100%';
  @Input() height: string = '100%';
  @Input() fontSize: string = '12px';
  @Input() btnSize: FlexiButtonSizeType = 'small';
  @Input() checkboxSize: string = '1.4em';
  @Input() actionBtnPosition: 'left' | 'right' = 'right';
  @Input() themeClass: string = 'light';
  @Input() loading: boolean = false;
  
  @Output() onSelected = new EventEmitter<FlexiTreeNode[]>();
  @Output() onEdit = new EventEmitter<FlexiTreeNode>();
  @Output() onDelete = new EventEmitter<FlexiTreeNode>();  

  searchTerm = signal<string>('');
  filteredTreeData = signal<FlexiTreeNode[]>([]);
  foundItemsCount = signal<number>(0);
  selectedNodes = signal<FlexiTreeNode[]>([]);

  ngAfterViewInit(): void {
    this.filteredTreeData.set(this.data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.filteredTreeData.set(this.data);
  } 

  toggleNode(node: FlexiTreeNode): void {
    if (node.children && node.children.length) {
      node.expanded = !node.expanded;
    }
  }

  toggleSelection(node: FlexiTreeNode, event: Event): void {
    event.stopPropagation();
    const isSelected = !node.selected;
    this.updateNodeAndChildrenSelection(node, isSelected);
    this.updateSelectedNodes();
    this.onSelected.emit(this.selectedNodes());
  }

  onSearch() {
    if (this.searchTerm().trim() === '') {
      this.filteredTreeData.set(this.data);
      this.foundItemsCount.set(0);
    } else {
      this.filteredTreeData.set(this.filterNodes(this.data, this.searchTerm().toLowerCase()));
      this.foundItemsCount.set(this.countFilteredNodes(this.filteredTreeData()));
    }
  }

  filterNodes(nodes: FlexiTreeNode[], term: string): FlexiTreeNode[] {
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

  countFilteredNodes(nodes: FlexiTreeNode[]): number {
    let count = 0;
    for (const node of nodes) {
      count++;
      if (node.children && node.children.length) {
        count += this.countFilteredNodes(node.children);
      }
    }
    return count;
  }

  collapseAll(): void {
    this.updateNodeExpansion(this.filteredTreeData(), false);    
  }

  expandAll(): void {
    this.updateNodeExpansion(this.filteredTreeData(), true);    
  }

  selectAll(): void {
    this.updateNodeSelection(this.filteredTreeData(), true);
  }

  deselectAll(): void {
    this.updateNodeSelection(this.filteredTreeData(), false);
  }

  private updateNodeExpansion(nodes: FlexiTreeNode[], expanded: boolean): void {
    nodes.forEach(node => {
      if (node.children && node.children.length) {
        node.expanded = expanded;       
        this.updateNodeExpansion(node.children, expanded);
      }
    });
  }

  private updateNodeAndChildrenSelection(node: FlexiTreeNode, isSelected: boolean): void {
    node.selected = isSelected;
    if (node.children && node.children.length) {
      node.children.forEach(child => this.updateNodeAndChildrenSelection(child, isSelected));
    }
  }

  private updateSelectedNodes(): void {
    const allSelectedNodes: FlexiTreeNode[] = [];
    const collectSelectedNodes = (nodes: FlexiTreeNode[]) => {
      nodes.forEach(node => {
        if (node.selected) {
          allSelectedNodes.push(node);
        }
        if (node.children && node.children.length) {
          collectSelectedNodes(node.children);
        }
      });
    };
    collectSelectedNodes(this.filteredTreeData());
    this.selectedNodes.set(allSelectedNodes);
  }

  private updateNodeSelection(nodes: FlexiTreeNode[], selected: boolean): void {
    nodes.forEach(node => {
      this.updateNodeAndChildrenSelection(node, selected);
    });
    this.updateSelectedNodes();
    this.onSelected.emit(this.selectedNodes());
  }

  onDeleteClick(node: FlexiTreeNode, event: Event): void {
    event.stopPropagation();
    this.onDelete.emit(node);
  }

  onEditClick(node: FlexiTreeNode, event: Event): void {
    event.stopPropagation();
    this.onEdit.emit(node);
  }
}