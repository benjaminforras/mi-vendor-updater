import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IndexComponent} from './_pages/index-component/index.component';

const routes: Routes = [
  {
    path: 'index', component: IndexComponent
  },
  {
    path: 'index/:id', component: IndexComponent
  },
  {
    path: '**', redirectTo: '/index'
  }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
