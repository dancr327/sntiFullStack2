import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';




bootstrapApplication(AppComponent, appConfig)
.catch((err) => console.error(err));

// CODIGO HWCHO CON COPILOT
// bootstrapApplication(AppComponent, {
//   providers: [appConfig.providers || [], provideRouter(routes)],
// }).catch((err) => console.error(err));
