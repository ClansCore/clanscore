import { Component, input } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';

@Component({
  selector: 'app-leaderboard-info',
  standalone: true,
  imports: [],
  templateUrl: './leaderboard-info.component.html',
  styleUrl: './leaderboard-info.component.scss'
})
export class LeaderboardInfoComponent {
  ownPoints = input.required<number | null>();
}
