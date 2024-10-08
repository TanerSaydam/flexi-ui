import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  selector: 'lib-flexi-treeview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <div class="flexi-tooltip-search-container">
        <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Ara...">
        <span class="material-symbols-outlined flexi-tooltip-search-icon">
          search
        </span>
      </div>
      <div class="search-results" *ngIf="searchTerm.trim() !== ''">
        {{ foundItemsCount }} sonuç bulundu
      </div>
    </div>
    <ul class="flexi-treeview">
      <ng-container *ngTemplateOutlet="treeTemplate; context: { nodes: filteredTreeData }"></ng-container>
    </ul>

    <ng-template #treeTemplate let-nodes="nodes">
      @for(node of nodes; track node.id){
        <li class="node-item">
          <div class="node-content" (click)="toggleNode(node)">
            @if(node.children && node.children.length){
              <div class="expand-icon">            
                <span class="material-symbols-outlined">
                    {{ node.expanded ? 'keyboard_arrow_down' : 'chevron_right' }}
                </span>
              </div>
            }
            @if(showCheckbox){
              <input type="checkbox" [checked]="node.selected" (change)="toggleSelection(node, $event)">
            }
            <div class="node-name">
              {{ node.name }}
            </div>
            <div class="node-description" *ngIf="node.description">{{ node.description }}</div>
          </div>
          <ul *ngIf="node.expanded && node.children && node.children.length">
            <ng-container *ngTemplateOutlet="treeTemplate; context: { nodes: node.children }"></ng-container>
          </ul>
        </li>
      }      
    </ng-template>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=chevron_right,keyboard_arrow_down,search');

    ul{
      list-style-type: none;      
    }

    .flexi-tooltip-search-container{
      position: relative;
    }

    .flexi-tooltip-search-icon{
      position: absolute;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
    }

    .node-item{
      margin-bottom: 5px;
    }

    .flexi-treeview {
      list-style-type: none;
      padding-left: 20px;
    }
    .node-content {
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .expand-icon {
      margin-right: 5px;
      font-size: 16px;      
    }
    .node-name {
      font-weight: bold;
      margin-left: 5px;
    }
    .node-description {
      display: block;
      margin-left: 20px;
      font-size: 0.9em;
      color: #666;
    }
    .search-container {
      margin-bottom: 10px;
    }

    .search-container input {
      width: 100%;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding-left: 40px;
    }

    .search-results {
      margin-top: 5px;
      font-size: 0.9em;
      color: #666;
    }
  `]
})
export class FlexiTreeviewComponent implements OnInit {
  @Input() treeData: TreeNode[] = [];
  @Input() showCheckbox: boolean = false;
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