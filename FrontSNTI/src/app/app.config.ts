import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Component, OnInit } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideAnimationsAsync(), provideAnimations(), provideHttpClient(), provideAnimationsAsync(), provideAnimationsAsync()]
};
