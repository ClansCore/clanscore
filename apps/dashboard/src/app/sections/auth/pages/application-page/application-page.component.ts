import { Component } from '@angular/core';
import { GuildInfoComponent } from '../../components/guild-info/guild-info.component';
import { ApplicationFormComponent } from '../../components/application-form/application-form.component';

@Component({
  selector: 'app-application-page',
  standalone: true,
  imports: [GuildInfoComponent, ApplicationFormComponent],
  templateUrl: './application-page.component.html',
  styleUrl: './application-page.component.scss'
})
export class ApplicationPageComponent {

}
