import { Routes } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { HomeComponent } from './home/home.component';
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
