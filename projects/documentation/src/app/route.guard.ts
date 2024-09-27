import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SharedService } from './shared.service';

export const routeGuard: CanActivateFn = (route, state) => {
  
  const shared = inject(SharedService);
      
  shared.openOrCloseFlexiSelectDropDown.set(false);
  shared.openOrCloseFlexiToastDropDown.set(false);
  shared.openOrCloseFlexiGridDropDown.set(false);

  if(state.url.includes("flexi-select")){
    shared.openOrCloseFlexiSelectDropDown.set(true);
  }else if(state.url.includes("flexi-toast")){
    shared.openOrCloseFlexiToastDropDown.set(true);
  }else if(state.url.includes("flexi-grid")){
    shared.openOrCloseFlexiGridDropDown.set(true);
  }
  return true;
};
