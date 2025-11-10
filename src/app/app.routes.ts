import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { UploadComponent } from './components/upload/upload';
import { VisualizeComponent } from './components/visualize/visualize';
import { ChatComponent } from './components/chat/chat';
import { AuthGuard, GuestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [GuestGuard]
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'upload',
    component: UploadComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'visualization',
    component: VisualizeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'visualize/:id',
    component: VisualizeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
