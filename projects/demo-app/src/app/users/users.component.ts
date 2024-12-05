import { Component, signal } from '@angular/core';
import { BlankComponent } from '../blank/blank.component';
import { FlexiSelectModule } from '../../../../flexi-select/src/lib/flexi-select.module';



@Component({
    imports: [
    BlankComponent,    
    FlexiSelectModule 
],
    templateUrl: './users.component.html',
    styleUrl: './users.component.css'
})
export class UsersComponent {
  data = signal<KasaHareketiResponseModel>(new KasaHareketiResponseModel());
  gelirGideler = signal<any[]>(gelirGideler);
}

export class KasaHareketiResponseModel{
    kasaId: string = "";
    kasaName: string = "";
    tlBorcToplam: number = 0;
    tlAlacakToplam: number = 0;
    tlBakiye: number = 0;
    usdBorcToplam: number = 0;
    usdAlacakToplam: number = 0;
    usdBakiye: number = 0;
    euroBorcToplam: number = 0;
    euroAlacakToplam: number = 0;
    euroBakiye: number = 0;
    kasaHareketleri: any[] = [];
}

export const gelirGideler:any[] = [
    {
        "name": "Mutfak Gideri",
        "id": "92c569f3-2431-45b3-955f-0c629b2c68d8",
        "isActive": true,
        "createdDate": "2024-12-04T15:28:16.3390631",
        "createdUserId": "d1bd974a-f8a5-4be8-453c-08dd123a6879",
        "createdBy": "Server Admin (admin@admin.com)",
        "updatedDate": null,
        "updatedUserId": null,
        "updatedBy": null,
        "isDeleted": false,
        "deletedDate": null,
        "deletedUserId": null,
        "deletedBy": null
    },
    {
        "name": "Avans Ödemesi",
        "id": "940cc334-0a67-41b9-b8a6-22347792bfa1",
        "isActive": true,
        "createdDate": "2024-12-04T15:28:37.7473473",
        "createdUserId": "d1bd974a-f8a5-4be8-453c-08dd123a6879",
        "createdBy": "Server Admin (admin@admin.com)",
        "updatedDate": null,
        "updatedUserId": null,
        "updatedBy": null,
        "isDeleted": false,
        "deletedDate": null,
        "deletedUserId": null,
        "deletedBy": null
    },
    {
        "name": "Ürün Satışı",
        "id": "d2c3673c-be83-431e-84ff-69bec1d11ca8",
        "isActive": true,
        "createdDate": "2024-12-04T15:28:09.0831186",
        "createdUserId": "d1bd974a-f8a5-4be8-453c-08dd123a6879",
        "createdBy": "Server Admin (admin@admin.com)",
        "updatedDate": null,
        "updatedUserId": null,
        "updatedBy": null,
        "isDeleted": false,
        "deletedDate": null,
        "deletedUserId": null,
        "deletedBy": null
    },
    {
        "name": "Personel Maaşı",
        "id": "d0c7bc11-d1f9-47aa-b837-adef98720838",
        "isActive": true,
        "createdDate": "2024-12-04T15:28:31.9232088",
        "createdUserId": "d1bd974a-f8a5-4be8-453c-08dd123a6879",
        "createdBy": "Server Admin (admin@admin.com)",
        "updatedDate": null,
        "updatedUserId": null,
        "updatedBy": null,
        "isDeleted": false,
        "deletedDate": null,
        "deletedUserId": null,
        "deletedBy": null
    },
    {
        "name": "Elektrik Gideri",
        "id": "63821040-58aa-4ec2-86d0-ae24d5f8b609",
        "isActive": true,
        "createdDate": "2024-12-04T15:28:22.8985955",
        "createdUserId": "d1bd974a-f8a5-4be8-453c-08dd123a6879",
        "createdBy": "Server Admin (admin@admin.com)",
        "updatedDate": null,
        "updatedUserId": null,
        "updatedBy": null,
        "isDeleted": false,
        "deletedDate": null,
        "deletedUserId": null,
        "deletedBy": null
    },
    {
        "name": "Doğalgaz Gideri",
        "id": "646ecbb6-3632-47b0-af7d-b8548acd15ab",
        "isActive": true,
        "createdDate": "2024-12-04T15:28:46.9480181",
        "createdUserId": "d1bd974a-f8a5-4be8-453c-08dd123a6879",
        "createdBy": "Server Admin (admin@admin.com)",
        "updatedDate": null,
        "updatedUserId": null,
        "updatedBy": null,
        "isDeleted": false,
        "deletedDate": null,
        "deletedUserId": null,
        "deletedBy": null
    }
]