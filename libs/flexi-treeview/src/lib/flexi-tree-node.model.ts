export interface FlexiTreeNode {
    id: string;
    name: string;
    code: string;
    description?: string;
    children?: FlexiTreeNode[];
    expanded?: boolean;
    selected?: boolean;
    isMain: boolean;
    originalData?: any;
    indeterminate: boolean;
  }