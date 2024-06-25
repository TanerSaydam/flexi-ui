import { FilterType } from "./flex-grid-column/flex-grid-column.component";

export class StateModel{
    pageNumber: number = 1;
    pageSize: number = 10;
    skip: number = 0;
    order: StateOrderModel = new StateOrderModel();
    filter: StateFilterModel[] = [];
  }

  export class StateOrderModel{
    dir: string = "";
    field: string = "";
  } 

  export class StateFilterModel{
    field: string = "";
    value: string = "";
    operator: string = "contains";
    type: FilterType = "text";
  }