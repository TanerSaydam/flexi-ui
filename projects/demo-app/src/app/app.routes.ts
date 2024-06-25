import { Routes } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { HomeComponent } from './home/home.component';
import { FlexiDataGridComponent } from './flexi-data-grid/flexi-data-grid.component';

export const routes: Routes = [
    {
        path: "",
        component: LayoutsComponent,
        children: [
            {
                path: "",
                component: HomeComponent
            },
            {
                path: "flexi-grid",
                component: FlexiDataGridComponent
            }
        ]
    },    
];
