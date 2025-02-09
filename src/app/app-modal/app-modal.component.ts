import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameComponent } from "../game/game.component";

@Component({
  selector: 'app-app-modal',
  standalone: true,
  imports: [CommonModule, GameComponent], // Add this line to import CommonModule
  templateUrl: './app-modal.component.html',
  styleUrls: ['./app-modal.component.css']
})
export class AppModalComponent {
  
  @Input() titleInstruction: string = ''; // Title of the modal
  @Input() contentInstruction: string = ''; // Body content of the modal
  @Input() showModalInstruction: boolean = false; // Flag to show/hide the modal



  @Input() titleSummary: string = ''; // Title of the modal
  @Input() contentSummary: string = ''; // Body content of the modal
  @Input() showModalSummary: boolean = false; // Flag to show/hide the modal


  @Input() isInstruction: boolean = false; // Flag to show/hide the modal

  @Output() closeModalInstruction = new EventEmitter<void>(); // EventEmitter to close the modal
  @Output() closeModalSummary = new EventEmitter<void>(); // EventEmitter to close the modal

 // Game modal inputs/outputs
 @Input() titleGame: string = 'Game Tutorial';
 @Input() showModalGame: boolean = false;

 @Output() closeModalGame = new EventEmitter<void>();
  constructor() {}

  closeGame(): void {
    this.closeModalGame.emit();
  }

  // Close the modal when the user clicks the close button or anywhere outside
  closeInstruction() {
    this.closeModalInstruction.emit(); // Emit close event
  }

  toggleModalInstruction() {
    this.showModalInstruction = !this.showModalInstruction;
  }


  closeSummary() {
    this.closeModalSummary.emit(); // Emit close event
  }

  toggleModalSummary() {
    this.showModalSummary = !this.showModalSummary;
  }
}
