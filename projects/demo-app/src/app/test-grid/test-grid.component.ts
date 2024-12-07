import { AfterContentInit, Component, contentChildren, input, signal, TemplateRef, contentChild } from '@angular/core';
import { FlexiGridModule } from '../../../../flexi-grid/src/lib/modules/flexi-grid.module';
import { FlexiGridColumnComponent } from '../../../../flexi-grid/src/lib/components/flexi-grid-column.component';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-test-grid',
  imports: [FlexiGridModule, NgTemplateOutlet],
  standalone: true,
  templateUrl: './test-grid.component.html',
  styleUrl: './test-grid.component.css'
})
export class TestGridComponent implements AfterContentInit{
  readonly commandTemplateRef = contentChild<TemplateRef<any>>('commandTemplate');
ngAfterContentInit(): void {
  console.log(this.columns());
}
data = input.required<any[]>();
readonly columns = contentChildren(FlexiGridColumnComponent, {descendants: true});
}
