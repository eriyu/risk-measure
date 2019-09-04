import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { KonvaSampleRoutingModule } from './konva-sample-routing.module';
import { IndexComponent } from './index/index.component';

@NgModule({
  declarations: [IndexComponent],
  imports: [
    CommonModule,
    FormsModule,
    KonvaSampleRoutingModule
  ]
})
export class KonvaSampleModule { }
