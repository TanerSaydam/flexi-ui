import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../shared.module';
import FullTreeViewComponent from './full/full.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({  
  imports: [SharedModule, FullTreeViewComponent,TranslocoModule],
  templateUrl: './flexi-treeview.component.html',  
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class FlexiTreeviewComponent {

}
