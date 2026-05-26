import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PositionsService, Position } from '../../services/positions.service';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './positions.html',
  styleUrls: ['./positions.css']
})
export class PositionsComponent implements OnInit {

  positions: Position[] = [];

  constructor(private positionsService: PositionsService) {}

  ngOnInit(): void {
    this.positionsService.loadPositions();

    this.positionsService.positions$.subscribe(data => {
      this.positions = data;
    });
  }
}