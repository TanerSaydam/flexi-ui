import { Routes } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { UsersComponent } from './users/users.component';

export const routes: Routes = [
    {
        path: "",
        component: LayoutsComponent,
        children: [
            {
                path: "",
                component: UsersComponent
            },
            {
                path: "users",
                component: UsersComponent
            }
        ]
    },    
];
