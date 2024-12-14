import { Routes } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { HomeComponent } from './home/home.component';
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
                canActivateChild: [routeGuard],
                children: [
                    {
                        path: "",
                        loadComponent:()=> import("./flexi-grid/flexi-grid.component")
                    },
                    {
                        path: "installation",
                        loadComponent:()=> import("./flexi-grid/installation/installation.component")
                    },
                    {
                        path: "first-use",
                        loadComponent:() => import("./flexi-grid/first-use/first-use.component")
                    },
                    {
                        path: "first-use",
                        loadComponent:() => import("./flexi-grid/first-use/first-use.component")
                    },
                    {
                        path: "caption",
                        loadComponent:() => import("./flexi-grid/caption/caption.component")
                    },
                    {
                        path: "change-theme",
                        loadComponent:() => import("./flexi-grid/change-theme/change-theme.component")
                    },
                    {
                        path: "custom-column",
                        loadComponent:() => import("./flexi-grid/custom-column/custom-column.component")
                    },
                    {
                        path: "data-binding",
                        loadComponent:() => import("./flexi-grid/data-binding/data-binding.component")
                    },
                    {
                        path: "reorderable",
                        loadComponent:() => import("./flexi-grid/reorderable/reorderable.component")
                    },
                    {
                        path: "export-excel",
                        loadComponent:() => import("./flexi-grid/export-excel/export-excel.component")
                    },
                    {
                        path: "filter",
                        loadComponent:() => import("./flexi-grid/filter/filter.component")
                    },
                    {
                        path: "footer",
                        loadComponent:() => import("./flexi-grid/footer/footer.component")
                    },
                    {
                        path: "index",
                        loadComponent:() => import("./flexi-grid/index/index.component")
                    },
                    {
                        path: "options",
                        loadComponent:() => import("./flexi-grid/options/options.component")
                    },
                    {
                        path: "pagination",
                        loadComponent:() => import("./flexi-grid/pagination/pagination.component")
                    },
                    {
                        path: "resizable",
                        loadComponent:() => import("./flexi-grid/resizable/resizable.component")
                    },
                    {
                        path: "sort",
                        loadComponent:() => import("./flexi-grid/sort/sort.component")
                    }                    
                ]
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
            },
            {
                path: "flexi-button",
                loadComponent: ()=> import("./flexi-button/flexi-button.component")
            },
            {
                path: "flexi-tooltip",
                loadComponent: ()=> import("./flexi-tooltip/flexi-tooltip.component")
            },
            {
                path: "flexi-treeview",
                canActivateChild: [routeGuard],
                children: [
                    {
                        path: "",
                        loadComponent: ()=> import("./flexi-treeview/flexi-treeview.component")
                    },                                       
                ]                
            }
        ]
    },    
];
