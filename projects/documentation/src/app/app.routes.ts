import { Routes } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { HomeComponent } from './home/home.component';
import { FlexiDataGridComponent } from './flexi-data-grid/flexi-data-grid.component';
import { routeGuard } from './route.guard';

export const routes: Routes = [
    {
        path: "",
        component: LayoutsComponent,
        children: [
            {
                path: "",
                component: HomeComponent,
                canActivate: [routeGuard]
            },
            {
                path: "flexi-grid",
                component: FlexiDataGridComponent
            },
            {
                path: "flexi-select",
                canActivateChild: [routeGuard],
                children: [
                    {
                        path: "",
                        loadComponent:()=> import("./flexi-select/flexi-select.component")
                    },
                    {
                        path: "installation",
                        loadComponent:()=> import("./flexi-select/installation/installation.component")
                    },
                    {
                        path: "first-use",
                        loadComponent:() => import("./flexi-select/first-use/first-use.component")
                    },
                    {
                        path: "custom-option",
                        loadComponent:() => import("./flexi-select/custom-option/custom-option.component")
                    },
                    {
                        path: "multiple",
                        loadComponent:() => import("./flexi-select/multiple/multiple.component")
                    },
                ]
                
            },            
            {
                path: "flexi-toast",
                canActivateChild: [routeGuard],
                children: [
                    {
                        path: "",
                        loadComponent:()=>import("./flexi-toast/flexi-toast.component")
                    },
                    {
                        path: "installation",
                        loadComponent: ()=>import("./flexi-toast/installation/installation.component")
                    },
                    {
                        path: "toast-use",
                        loadComponent: ()=>import("./flexi-toast/toast-use/toast-use.component")
                    },
                    {
                        path: "toast-test",
                        loadComponent: ()=>import("./flexi-toast/toast-test/toast-test.component")
                    },
                    {
                        path: "swal-use",
                        loadComponent: ()=>import("./flexi-toast/swal-use/swal-use.component")
                    },
                    {
                        path: "swal-test",
                        loadComponent: ()=>import("./flexi-toast/swal-test/swal-test.component")
                    }
                ]
            }
        ]
    },    
];
