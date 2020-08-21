import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  openSidenav = false;
  title = 'ng-fitness-tracker';

  onToggle() {}
}
