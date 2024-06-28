import { Injectable } from "@angular/core";
import { StateFilterModel, StateModel } from "./state.model";

@Injectable({
    providedIn: "root"
})
export class FlexiGridService {
    getODataEndpoint(state: StateModel) {
        let endpoint = `$top=${state.pageSize}&$skip=${state.skip}`;

        if (state.sort.field !== '') {
            endpoint += `&$orderby=${this.toTitleCase(state.sort.field)}`;
            if (state.sort.dir === 'desc') {
                endpoint += ` desc`;
            }
        }

        if (state.filter.length > 0) {
            const filters = state.filter.filter(p=> p.value);
            
            if(filters.length > 0) {
                endpoint += `&$filter=`;
                let filterValue: string = "";
    
                filters.forEach((val: StateFilterModel) => {
    
                    if (filterValue !== "") {
                        filterValue = filterValue + " and ";
                    }
    
                    if (val.type === "date") {
                        const date = new Date(val.value);
                        const isoDate = date.toISOString().split('T')[0];
                        filterValue += `${this.toTitleCase(val.field)} eq ${isoDate}`;
                    }
                    else if (val.type === "date-time") {
                        const date = new Date(val.value);
                        const isoDate = date.toISOString()
                        filterValue += `${this.toTitleCase(val.field)} eq ${isoDate}`;
                    }
                    else if (val.type === "number") {
                        if (val.operator === "contains") val.operator = "eq";
                        filterValue += `${this.toTitleCase(val.field)} ${val.operator} ${val.value}`;
                    }
                    else if (val.type === "text") {
                        switch (val.operator) {
                            case "contains":
                                filterValue += `contains(${this.toTitleCase(val.field)}, '${val.value}')`;
                                break;
                            case "not contains":
                                filterValue += `not(contains(${this.toTitleCase(val.field)}, '${val.value}'))`;
                                break;
                            case "startswith":
                                filterValue += `startswith(${this.toTitleCase(val.field)}, '${val.value}')`;
                                break;
                            case "endswith":
                                filterValue += `endswith(${this.toTitleCase(val.field)}, '${val.value}')`;
                                break;
                            case "eq":
                            case "ne":
                                filterValue += `${this.toTitleCase(val.field)} ${val.operator} '${val.value}'`;
                                break;
                            default:
                                filterValue += `${this.toTitleCase(val.field)} ${val.operator} '${val.value}'`;
                                break;
                        }
                    }
                });
                endpoint += filterValue;
            }
        }

        return endpoint;
    }

    toTitleCase(str: string) {
        return str
            .split(' ') // Metni boşluklardan ayırarak kelimelere bölüyoruz.
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Her kelimenin ilk harfini büyük yapıyoruz.
            .join(' '); // Kelimeleri tekrar birleştiriyoruz.
    }

    exportDataToExcel(data: any[], fileName: string) {
        if (data.length === 0) {
          console.error('No data to export');
          return;
        }
      
        // Sütun başlıklarını elde et
        const headers = Object.keys(data[0]);
      
        // CSV string oluşturma
        let csvData = headers.join(',') + '\n';
        data.forEach(row => {
          let rowData = headers.map(header => {
            const cellData = row[header] ? row[header].toString().replace(/"/g, '""') : '';
            return `"${cellData}"`;
          }).join(',');
          csvData += rowData + '\n';
        });
      
        // CSV dosyasını indirme
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', fileName + '.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
}