import { Component, Input } from '@angular/core';
import { Question } from '../models/question';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-parsons-columns',
  templateUrl: './parsons-columns.component.html',
  styleUrls: ['./parsons-columns.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule ]
})
export class ParsonsColumnsComponent {
  @Input() questions: Question[] = [];
  @Input() currentQuestion: Question | null = null;

  // Add logic for column dragging and dropping here
}
