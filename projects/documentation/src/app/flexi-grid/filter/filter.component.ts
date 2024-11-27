import { Component, ViewEncapsulation, signal } from '@angular/core';
import { FilterType, FlexiGridFilterDataModel, FlexiGridModule } from 'flexi-grid';
import { UserModel } from '../../models/user.model';
import { UsersData } from '../data';
import { dataTSCode, filterHTMLCode, filterTSCode } from '../code';
import { SharedModule } from '../../shared.module';


@Component({
    selector: 'app-filter',
    imports: [
        FlexiGridModule,
        SharedModule
    ],
    templateUrl: './filter.component.html',
    styleUrl: './filter.component.css',
    encapsulation: ViewEncapsulation.None
})
export default class FilterComponent {
  users = signal<UserModel[]>(UsersData);
  filterable = signal<boolean>(true);
  idFilterable = signal<boolean>(true);
  idFilterType = signal<FilterType>("text");
  firstNameFilterable = signal<boolean>(true);
  firstNameFilterType = signal<FilterType>("text");
  lastNameFilterable = signal<boolean>(true);
  lastNameFilterType = signal<FilterType>("text");
  dateOfBirthFilterable = signal<boolean>(true);
  dateOfBirthFilterType = signal<FilterType>("date");
  salaryFilterable = signal<boolean>(true);
  salaryFilterType = signal<FilterType>("number");
  isActiveFilterable = signal<boolean>(true);
  isActiveFilterType = signal<FilterType>("boolean");
  filterTSCode = signal<string>(filterTSCode);
  filterHTMLCode = signal<string>(filterHTMLCode);
  dataCode = signal<string>(dataTSCode);
  filterData = signal<FlexiGridFilterDataModel[]>([
    {
      value: "Kayseri",
      name: "Kayseri"
    },
    {
      value: "İstanbul",
      name: "İstanbul"
    },
    {
      value: "Ankara",
      name: "Ankara"
    }
  ])
  filterCodeExample = signal<string>(`
 <flexi-grid
    .
    .
    [filterable]="true"
    captionTitle="User List"
    >

    <!-- İsterseniz column bazlı filter özelliğini kapatabilirsiniz -->
    <flexi-grid-column field="id" [filterable]="false" title="Id"></flexi-grid-column>

    <!-- Filter açık olmasa bile fiter type vererek columnları formatlayabilirsiniz. Eğer filter açıksa onun tipini de belirliyor -->
    <flexi-grid-column 
      field="dateOfBirth" 
      [filterable]="dateOfBirthFilterable()" 
      [filterType]="dateOfBirthFilterType()" 
      filterType="date" format="dd.MM.yyyy" 
      title="Date Of Birth"
    >
    </flexi-grid-column>
    <!-- Kodun çıktısı: 29.06.2024 -->
    
    <flexi-grid-column 
      field="salary" 
      [filterable]="salaryFilterable()" 
      [filterType]="salaryFilterType()" 
      filterType="number" 
      format="n" 
      [fraction]="2" 
      title="Salary"
    >
    </flexi-grid-column>
    <!-- Kodun çıktısı: 29.903,19 -->

    <flexi-grid-column 
      field="salary" 
      [filterable]="salaryFilterable()" 
      [filterType]="salaryFilterType()" 
      filterType="number" 
      format="n" 
      [fraction]="2" 
      title="Salary"
    >
    </flexi-grid-column>
    <!-- Kodun çıktısı: 29.903,19 -->

    <flexi-grid-column 
      field="salary" 
      [filterable]="salaryFilterable()" 
      [filterType]="salaryFilterType()" 
      filterType="number" 
      format="c" 
      symbol="₺" 
      [showSymbolInFront]="true" 
      [fraction]="2" 
      title="Salary"
    >
    </flexi-grid-column>
    <!-- Kodun çıktısı: ₺29.903,19 -->
  `);
}
