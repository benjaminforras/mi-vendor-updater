import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IndexComponent } from './_pages/index-component/index.component';

const routes: Routes = [
  {
    path: 'index', component: IndexComponent
  },
  {
    path: '**', redirectTo: '/index'
  }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
