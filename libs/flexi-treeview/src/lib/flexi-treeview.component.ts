import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, signal, AfterViewInit, OnChanges, SimpleChanges, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexiButtonComponent, FlexiButtonSizeType } from 'flexi-button';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { FlexiTreeNode } from './flexi-tree-node.model';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'flexi-treeview',
    imports: [CommonModule, FormsModule, FlexiButtonComponent, FlexiTooltipDirective, RouterLink],
    templateUrl: "./flexi-treeview.component.html",
    styleUrl: "./flexi-treeview.component.css",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiTreeviewComponent implements AfterViewInit, OnChanges {  
  readonly data = input<FlexiTreeNode[]>([]);
  readonly treeviewTitle = input<string>('');
  readonly showCheckbox = input<boolean>(false);
  readonly showEditButton = input<boolean>(true);
  readonly showDeleteButton = input<boolean>(true);
  readonly showSearch = input<boolean>(true);
  readonly showActions = input<boolean>(true);
  readonly width = input<string>('100%');
  readonly height = input<string>('100%');
  readonly fontSize = input<string>('13px');
  readonly btnSize = input<FlexiButtonSizeType>('x-small');
  readonly checkboxSize = input<string>('1.4em');
  readonly actionBtnPosition = input<'left' | 'right'>('right');
  readonly themeClass = input<string>('light');
  readonly loading = input<boolean>(false);  
  readonly expend = input<boolean>(true);
  readonly showDetailButton = input<boolean>(false);
  readonly detailRouterLink = input<string>("");
  
  readonly onSelected = output<FlexiTreeNode[]>();
  readonly onEdit = output<FlexiTreeNode>();
  readonly onDelete = output<FlexiTreeNode>();
  readonly onRefresh = output();

  searchTerm = signal<string>('');
  filteredTreeData = signal<FlexiTreeNode[]>([]);
  foundItemsCount = signal<number>(0);
  selectedNodes = signal<FlexiTreeNode[]>([]);

  ngAfterViewInit(): void {
    this.filteredTreeData.set(this.data());
    if(this.expend()){
      this.expandAll();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.filteredTreeData.set(this.data());
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
    this.updateParentSelection(node);
    this.updateSelectedNodes();
    this.onSelected.emit(this.selectedNodes().filter(p=> p.isMain == false));
  }

  onSearch() {
    if (this.searchTerm().trim() === '') {
        this.filteredTreeData.set(this.data());
        this.foundItemsCount.set(0);
    } else {
        this.filteredTreeData.set(this.filterNodes(this.data(), this.searchTerm().toLowerCase()));
        this.foundItemsCount.set(this.countFilteredNodes(this.filteredTreeData()));
    }
}

filterNodes(nodes: FlexiTreeNode[], term: string): FlexiTreeNode[] {
  const filteredNodes: FlexiTreeNode[] = [];

  for (const node of nodes) {
      let matched = node.name.toLowerCase().includes(term) ||
                    (node.description && node.description.toLowerCase().includes(term));

      if (matched) {
          // Düğüm eşleşiyorsa, tüm çocuklarını olduğu gibi ekleyin
          const newNode: FlexiTreeNode = {
              ...node,
              expanded: true, // Eşleşen düğümleri genişletmek için
              // Çocukları filtrelemeden ekliyoruz
          };
          filteredNodes.push(newNode);
      } else if (node.children && node.children.length) {
          // Düğüm eşleşmiyor, ancak çocukları olabilir
          const filteredChildren = this.filterNodes(node.children, term);
          if (filteredChildren.length > 0) {
              const newNode: FlexiTreeNode = {
                  ...node,
                  children: filteredChildren,
                  expanded: true, // Çocukları eşleşiyorsa düğümü genişletmek için
              };
              filteredNodes.push(newNode);
          }
          // Eğer çocuklardan hiçbiri eşleşmiyorsa, düğümü eklemiyoruz
      }
      // Düğüm eşleşmiyorsa ve çocukları yoksa, düğümü eklemiyoruz
  }

  return filteredNodes;
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

  refresh(): void{
    this.onRefresh.emit();
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
    node.indeterminate = false;

    if (node.children && node.children.length) {
      node.children.forEach(child => this.updateNodeAndChildrenSelection(child, isSelected));
    }
  }

  private updateParentSelection(node: FlexiTreeNode): void {
    const parentNode = this.findParentNode(node);
    if (!parentNode) return;
  
    const allChildren = parentNode.children!;
    const allSelected = allChildren.every(child => child.selected);
    const anySelected = allChildren.some(child => child.selected || child.indeterminate);
  
    parentNode.selected = allSelected;
    parentNode.indeterminate = !allSelected && anySelected;
  
    this.updateParentSelection(parentNode);
  }

  private findParentNode(node: FlexiTreeNode): FlexiTreeNode | undefined {
    for (const parentNode of this.filteredTreeData()) {
      if (parentNode.children?.includes(node)) {
        return parentNode;
      }
      if (parentNode.children) {
        const found = this.findParentNodeInChildren(parentNode.children, node);
        if (found) return found;
      }
    }
    return undefined;
  }

  private findParentNodeInChildren(children: FlexiTreeNode[], node: FlexiTreeNode): FlexiTreeNode | undefined {
    for (const child of children) {
      if (child.children?.includes(node)) {
        return child;
      }
      if (child.children) {
        const found = this.findParentNodeInChildren(child.children, node);
        if (found) return found;
      }
    }
    return undefined;
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
    this.onSelected.emit(this.selectedNodes().filter(p=> p.isMain == false));
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