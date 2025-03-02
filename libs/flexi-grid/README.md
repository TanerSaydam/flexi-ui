# Flexi Grid

Flexi Grid is an advanced, lightweight, and customizable Angular 19 data grid component. It provides powerful features such as filtering, sorting, resizing, data binding, multi-language support, and both light and dark themes.

This library is designed to be flexible and easy to integrate into any Angular application, offering a seamless user experience with responsive and interactive data tables.

## Features

Flexi Grid comes with a variety of powerful features, making it a versatile choice for displaying and managing tabular data in Angular applications.

- ✅ **Filtering**: Supports multiple filter types, including text, number, date, and boolean filters.
- 🔄 **Sorting**: Column-based sorting with ascending and descending options.
- 📏 **Resizable Columns**: Allows users to adjust column widths dynamically.
- 🔗 **Data Binding**: Works seamlessly with both static and dynamic data sources.
- 🌍 **Multi-language Support**: Built-in support for English (`en`) and Turkish (`tr`).
- 🎨 **Theme Options**: Choose between **light** and **dark** modes.
- 📊 **Pagination**: Supports configurable page sizes and navigation.
- 👀 **Column Visibility Control**: Toggle column visibility dynamically.
- 📤 **Excel Export**: Export table data to an Excel file with a single click.
- 🎭 **Custom Templates**: Allows custom header, footer, and cell templates for advanced customization.

## Installation

To install **Flexi Grid** in your Angular 19 project, use the following command:

```sh
npm install flexi-grid
```

### Importing the Module

After installation, import **Flexi Grid** into your Angular module:

```ts
import { FlexiGridModule } from 'flexi-grid';

@Component({
    imports: [
    FlexiGridModule
],
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {}
```

## Basic Usage

To use **Flexi Grid**, add the `<flexi-grid>` component to your template and bind it to your data.

```html
<flexi-grid [data]="data">
  <flexi-grid-column field="id" title="ID" width="70px" />
  <flexi-grid-column field="name" title="Name" />
  <flexi-grid-column field="email" title="Email" />
  <flexi-grid-column field="salary" title="Salary" filterType="number" format="c" textAlign="right" symbol="$" />
  <flexi-grid-column field="startDate" title="Start Date" filterType="date" format="dd MMM yyyy" />
</flexi-grid>
```

## Component Data Example

In your component file (**.ts**), define the **data** array:

```ts
export class ExampleComponent {
  data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', salary: 5000, startDate: "2024-01-02" },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', salary: 6000, startDate: "2024-01-05" },
    { id: 3, name: 'Alice Brown', email: 'alice@example.com', salary: 7000, startDate: "2024-02-03" }
  ];
}
```

This will render a data grid with columns for ID, Name, Email, and Salary, along with filtering and sorting functionalities.

## API Documentation

### `<flexi-grid>` Inputs

| Input                 | Type                     | Default   | Description |
|-----------------------|-------------------------|-----------|-------------|
| `data`               | `any[]`                  | `[]`      | The dataset to be displayed in the grid. |
| `total`              | `number` \| `null`       | `0`       | Total number of records (useful for server-side pagination). |
| `dataBind`           | `boolean`                | `false`   | Enables server-side data binding. When `true`, the grid does not handle filtering, sorting, or pagination on the client-side. Instead, it provides a `StateModel` object inside the `dataStateChange` output event, which contains the current grid state (pagination, sorting, and filtering). You need to manually handle API requests in your service using this state object. |
| `pageable`           | `boolean`                | `true`    | Enables or disables pagination. |
| `sortable`           | `boolean`                | `true`    | Enables or disables sorting. |
| `filterable`         | `boolean`                | `true`    | Enables or disables filtering. |
| `themeClass`         | `"light"` \| `"dark"`    | `"light"` | Sets the theme of the grid. |
| `showIndex`          | `boolean`                | `false`   | Displays row index numbers. |
| `showColumnVisibility` | `boolean`              | `true`    | Enables column visibility toggling. |
| `showExportExcelBtn` | `boolean`                | `false`   | Enables Excel export functionality. |
| `exportExcelFileName` | `string`               | `"export"` | Sets the filename for exported Excel files. |
| `width`              | `string`                 | `"100%"`  | Defines the width of the grid. |
| `height`             | `string`                 | `"500px"` | Defines the height of the grid. |
| `language`           | `"tr"` \| `"en"`         | `"tr"`    | Sets the language for UI elements. |
| `reorderable`        | `boolean`                | `false`   | Enables row reordering via drag-and-drop. |
| `selectable`         | `boolean`                | `false`   | Enables row selection. |

---

### `<flexi-grid-column>` Inputs

| Input            | Type                                  | Default      | Description |
|-----------------|--------------------------------------|--------------|-------------|
| `field`        | `string`                              | `""`         | The field name in the data source. |
| `title`        | `string`                              | `""`         | The column title displayed in the header. |
| `sortable`     | `boolean`                             | `true`       | Enables sorting for this column. |
| `filterable`   | `boolean`                             | `true`       | Enables filtering for this column. |
| `filterType`   | `"text"` \| `"number"` \| `"date"`    | `"text"`     | The type of filter for this column. |
| `width`        | `string`                              | `"160px"`    | Sets the column width. |
| `textAlign`    | `"left"` \| `"center"` \| `"right"`   | `"left"`     | Aligns the text in the column. |
| `format`       | `"n"` \| `"c"` \| `null`             | `null`       | Number formatting, `"c"` for currency. |
| `symbol`       | `string`                              | `""`         | Currency symbol for formatted numbers. |
| `visible`      | `boolean`                             | `true`       | Controls column visibility. |
| `resizable`    | `boolean`                             | `true`       | Allows resizing of the column. |
| `className`    | `string`                              | `""`         | Custom CSS class for styling. |

## Advanced Usage

### Custom Caption, Header, Cell, Column Command and Footer Templates

You can customize the **caption**, **header**, **cell**, **column command **, and **footer** of any column using Angular templates.

#### Custom Caption Command Template

Use `flexiGridCaptionCommandTemplate` for adding commands to the table caption:

```html
<flexi-grid>
  <ng-template flexiGridCaptionCommandTemplate>
    <flexi-button btnColor="primary" btnIcon="add" btnSize="small" flexiTooltip title="Add" />
  </ng-template>
</flexi-grid>
```

#### Custom Cell Template

Use `flexiGridCellTemplate` to define a custom cell template:

```html
<flexi-grid [data]="data">
  <flexi-grid-column field="name" title="Full Name">
    <ng-template flexiGridCellTemplate let-item>
      <b>{{ item.name }}</b>
    </ng-template>
  </flexi-grid-column>
</flexi-grid>
```

#### Custom Header Template

Use `flexiGridHeaderTemplate` to define a custom header:

```html
<flexi-grid-column field="salary" title="Salary">
  <ng-template flexiGridHeaderTemplate>
    <input type="search" class="form-control" [(ngModel)]="filterSalary" (keyup)="filterSalary()">
  </ng-template>
</flexi-grid-column>
```

#### Custom Footer Template

Use `flexiGridFooterTemplate` for footer customization:

```html
<flexi-grid-column field="salary" title="Salary">
  <ng-template flexiGridFooterTemplate let-data>
    Total: {{ data.reduce((sum, item) => sum + item.salary, 0) | currency }}
  </ng-template>
</flexi-grid-column>
```

#### Custom Command Column Template

Use `flexiGridColumnCommandTemplate` to define a custom command column template:

```html
<flexi-grid-column field="actions" title="Actions">
  <ng-template flexiGridColumnCommandTemplate let-item>
    <flexi-button btnColor="primary" btnIcon="zoom_in" btnSize="x-small" title="Detail" flexiTooltip/>
    <flexi-button btnColor="warning" btnIcon="edit" btnSize="x-small" flexiTooltip title="Edit" />
    <flexi-button btnColor="danger"  btnSize="x-small" (click)="deleteByItem(item)" btnIcon="delete" flexiTooltip title="Delete" />
  </ng-template>
</flexi-grid-column>
```

## Documentation

For a complete guide on usage, customization, and API reference, please visit the official documentation:

📖 **[Flexi Grid Documentation](https://flexi-ui.ecnorow.com/flexi-grid)**

## Contributing

We welcome contributions to improve **Flexi Grid**! If you would like to contribute, please follow these steps:

1. **Fork the Repository** – Clone your fork locally.
2. **Create a Branch** – Use a meaningful name, e.g., `feature/custom-theme-support`.
3. **Make Your Changes** – Ensure the code follows Angular best practices.
4. **Commit and Push** – Write clear commit messages.
5. **Create a Pull Request** – Submit your changes for review.

### Reporting Issues

If you find a bug or want to request a feature, please open an issue on GitHub.

## License

Flexi Grid is open-source and available under the **MIT License**.