import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CdkDragDrop, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { QuestionService } from '../services/question.service';
import { Column, columnQuestion, TwoNFTable } from '../models/columnQuestion';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppModalComponent } from '../app-modal/app-modal.component';
import { ProfessorSpeechComponent } from "../professor-speech/professor-speech.component";
// Import the reusable tutorial component and its TutorialStep interface
import { ParsonsTutorialComponent, TutorialStep } from '../parsons-tutorial/parsons-tutorial.component';

@Component({
  selector: 'app-parsons-columns',
  templateUrl: './parsons-columns.component.html',
  styleUrls: ['./parsons-columns.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, AppModalComponent, ProfessorSpeechComponent, ParsonsTutorialComponent]
})
export class ParsonsColumnsComponent implements OnInit {
  @Input() currentQuestion: columnQuestion | null = null;  // Provided from parent
  @Input() showNextButton: boolean = false;
  @Input() questionId: number | null = null;
  @Input() stage: number | null = 3;
  @Output() completed: EventEmitter<void> = new EventEmitter<void>();

  // Professor and modal properties
  showProfessorModal: boolean = false;
  decomposerDialogues: any = {}; // Replace with actual dialogues

  // Tutorial configuration for the reusable tutorial component
  tutorialStepsConfig: TutorialStep[] = [];

  // ----------------- TUTORIAL SIMULATION PROPERTIES -----------------
  currentStepText: string = 'Step 1: The "Show Table" button will be highlighted and auto-clicked to reveal the tables.';
  highlightToggleTableButton: boolean = false;
  highlightGetFeedback: boolean = false;
  tutorialOver: boolean = false;
  showRepeatModal: boolean = false;

  // Modal properties for instruction/summary (if needed)
  showInstructionModal: boolean = false;
  showSummaryModal: boolean = false;
  instructionModalTitle: string = 'Instructions';
  SummaryModalTitle: string = 'Summary';
  instructionModalContent: string = "";
  summaryModalContent: string = "";

  // Data properties
  questions: columnQuestion[] = [];
  availableColumns: Column[] = [];
  connectedDropLists: string[] = [];
  columnAssignments: Record<string, Column[]> = {};
  discardedColumns: Column[] = [];
  selectedQuestionId: number | null = null;
  highlightedStatus: { [key: string]: string } = {};
  feedbackMessages: { [key: string]: string } = {};
  progressText: string = '';
  feedbackGiven: boolean = false;
  showTable: boolean = true;
  twoNFTables: TwoNFTable[] = [];
  errorMessage: string = '';

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.loadQuestions();
    this.tutorialStepsConfig = [
      {
        instruction: 'Step 1: The "Show Table" button will be highlighted and auto-clicked to reveal the tables.',
        delay: 2500,
        action: () => this.simulateToggleTable()
      },
      {
        instruction: 'Step 1.1: The "Hide Table" button will be highlighted and auto-clicked to hide the tables.',
        delay: 2500,
        action: () => this.simulateHideTable()
      },
      {
        instruction: 'Step 2: Columns are being automatically dragged from the available list to the tables.',
        delay: 1500,
        action: () => this.simulateDragColumns()
      },
      {
        instruction: 'Step 3: The "Get Feedback" button is highlighted. Feedback will be applied shortly.',
        delay: 2000,
        action: () => {
          this.highlightGetFeedback = true;
          setTimeout(() => {
            this.getFeedback();
            this.tutorialOver = true;
            setTimeout(() => {
              this.showRepeatModal = true;
            }, 3000);
          }, 2000);
        }
      }
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadData();
  }

  loadData(): void {
    if (!this.questionId) {
      console.error('Invalid question ID:', this.questionId);
      return;
    }
    this.questionService.getTwoNFData(this.questionId).subscribe({
      next: (response) => {
        if (response.success) {
          this.twoNFTables = this.filterTablesByStage(response.data, this.stage || 3);
          this.setupColumns();
        } else {
          console.error('Failed to load data for 2NF stage.');
        }
      },
      error: (err) => console.error('Error loading data:', err),
    });
  }

  filterTablesByStage(data: any[], stage: number): TwoNFTable[] {
    switch (stage) {
      case 1:
        return data.filter(table => table.context === '0-1NF');
      case 2:
        return data.filter(table => table.context === '1-2NF');
      default:
        return data;
    }
  }

  setupColumns(): void {
    if (!this.currentQuestion) { return; }
    // Build availableColumns from twoNFTables
    this.availableColumns = this.currentQuestion.twoNFTables.flatMap(table =>
      table.columns.map(col => ({
        columnName: col.columnName,
        keyType: col.keyType,
        referencesTable: col.referencesTable,
        tableName: table.tableName,
      }))
    );
    // Initialize assignments for each table
    this.columnAssignments = {};
    this.currentQuestion.twoNFTables.forEach(table => {
      this.columnAssignments[table.tableName] = [];
    });
  }

  loadQuestions(): void {
    this.questionService.getColumnQuestions().subscribe({
      next: (response) => {
        if (response.success) {
          this.questions = response.data;
          if (this.questions.length > 0) {
            this.selectedQuestionId = this.questions[0].questionId;
            this.setCurrentQuestion();
          }
        }
      },
      error: (err) => console.error('Error loading questions:', err),
    });
  }

  setCurrentQuestion(): void {
    this.currentQuestion = this.questions.find(q => q.questionId === this.selectedQuestionId) || null;
    if (this.currentQuestion) {
      this.availableColumns = this.currentQuestion.twoNFTables.flatMap(table =>
        table.columns.map(col => ({
          columnName: typeof col === 'string' ? col : col.columnName,
          keyType: typeof col === 'object' && 'keyType' in col ? col.keyType : 'NONE',
          referencesTable: typeof col === 'object' && 'referencesTable' in col ? col.referencesTable : null,
          tableName: table.tableName,
        }))
      );
      this.initInstructionModal();
      this.currentQuestion.twoNFTables.forEach(table => {
        this.columnAssignments[table.tableName] = [];
      });
      this.connectedDropLists = [
        'availableColumnsList',
        ...Object.keys(this.columnAssignments).map(key => key + 'List')
      ];
      // Configure the tutorial steps for this component.
      
    }
  }

  // ----------------- SIMULATION FUNCTIONS -----------------

  toggleTable(): void {
    this.showTable = !this.showTable;
  }

  simulateToggleTable(): void {
    this.currentStepText =
      'Step 1: Highlighting the "Show Table" button. It will be auto-clicked to reveal the tables.';
    this.highlightToggleTableButton = true;
    setTimeout(() => {
      this.toggleTable(); // Show tables
      this.highlightToggleTableButton = false;
      this.simulateHideTable();
    }, 2500);
  }

  simulateHideTable(): void {
    this.currentStepText =
      'Step 1.1: The tables are visible. Now the "Hide Table" button is highlighted and will be auto-clicked to hide the tables.';
    this.highlightToggleTableButton = true;
    setTimeout(() => {
      this.toggleTable(); // Hide tables
      this.highlightToggleTableButton = false;
      this.currentStepText =
        'Step 2: Drag simulation in progress. Columns are being automatically moved from the available list to the tables.';
      setTimeout(() => {
        this.simulateDragColumns();
      }, 1500);
    }, 2500);
  }

  simulateDragColumns(): void {
    if (this.availableColumns.length > 0) {
      const draggedColumn = this.availableColumns.shift();
      if (!draggedColumn) return;
      const tableNames = Object.keys(this.columnAssignments);
      const targetTable = tableNames[(tableNames.length - this.availableColumns.length) % tableNames.length];
      setTimeout(() => {
        this.columnAssignments[targetTable].push(draggedColumn);
        if (this.availableColumns.length > 0) {
          setTimeout(() => {
            this.simulateDragColumns();
          }, 1500);
        } else {
          this.currentStepText =
            'Step 3: The "Get Feedback" button is highlighted. When clicked, columns will be evaluated.';
          this.highlightGetFeedback = true;
          setTimeout(() => {
            this.getFeedback();
            this.tutorialOver = true;
            setTimeout(() => {
              this.showRepeatModal = true;
            }, 3000);
          }, 2000);
        }
      }, 1500);
    }
  }

  getFeedback(): void {
    Object.keys(this.columnAssignments).forEach(tableName => {
      this.columnAssignments[tableName].forEach((col: Column) => {
        const key = `${tableName}_${col.columnName}_${col.keyType}`;
        this.highlightedStatus[key] = 'correct';
        this.feedbackMessages[key] = 'Correct placement!';
      });
    });
    this.feedbackGiven = true;
    this.currentStepText =
      'Feedback given: All columns are marked correct. Tutorial complete.';
    setTimeout(() => {
      this.highlightGetFeedback = false;
    }, 2000);
  }

  repeatTutorial(): void {
    this.feedbackGiven = false;
    this.feedbackMessages = {};
    this.highlightedStatus = {};
    this.highlightGetFeedback = false;
    this.tutorialOver = false;
    this.showRepeatModal = false;
    this.resetPuzzle();
    this.currentStepText =
      'Step 1: The "Show Table" button will be highlighted and auto-clicked to reveal the tables.';
    setTimeout(() => {
      this.simulateToggleTable();
    }, 2500);
  }

  resetPuzzle(): void {
    if (!this.currentQuestion) return;
    this.availableColumns = this.currentQuestion.twoNFTables.flatMap((table) =>
      table.columns.map((col) => ({
        columnName: col.columnName,
        keyType: col.keyType,
        referencesTable: col.referencesTable,
        tableName: table.tableName,
      }))
    );
    this.shuffleArray(this.availableColumns);
    this.columnAssignments = {};
    this.currentQuestion.twoNFTables.forEach((table) => {
      this.columnAssignments[table.tableName] = [];
    });
  }

  shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  navigateToNextQuestion(): void {
    this.completed.emit();
  }

  // ----------------- UTILITY FUNCTIONS -----------------

  isPrimaryKey(column: Column): boolean {
    return column.keyType === 'PK';
  }

  isForeignKey(column: Column): boolean {
    return column.keyType === 'FK';
  }

  feedbackKeyForColumn(column: Column, tableName: string): string {
    return `${column.columnName}_${tableName}_${column.keyType}`;
  }

  // ----------------- MODAL UTILITY FUNCTIONS -----------------

  toggleInstructionModal(): void {
    this.showInstructionModal = !this.showInstructionModal;
  }

  closeInstructionModal(): void {
    this.showInstructionModal = false;
  }

  closeSummaryModal(): void {
    this.showSummaryModal = false;
  }

  initInstructionModal(): void {
    this.showInstructionModal = true;
    this.instructionModalContent = this.currentQuestion?.instructions || "";
  }

  // onTutorialComplete() for the reusable tutorial component:
  onTutorialComplete(): void {
    // When the reusable tutorial completes, you might want to hide it.
    // (This function is called from the ParsonsTutorialComponent.)
    // For this example, we simply log completion.
    console.log("Tutorial simulation complete.");
  }

  onDrop(event: CdkDragDrop<Column[]>): void {
    if (event.previousContainer === event.container) {
      // No action for reordering within the same list
      return;
    }
  
    const draggedItem = event.previousContainer.data[event.previousIndex];
  
    if (event.previousContainer.id === 'availableColumnsList') {
      // Moving from availableColumns to a specific table
      const targetTable = event.container.id.replace('List', '');
      if (this.columnAssignments[targetTable]) {
        transferArrayItem(
          event.previousContainer.data,
          this.columnAssignments[targetTable],
          event.previousIndex,
          event.currentIndex
        );
      }
    } else if (event.container.id === 'availableColumnsList') {
      // Moving back from a specific table to availableColumns
      if (!this.availableColumns.some((col) => col.columnName === draggedItem.columnName)) {
        transferArrayItem(
          event.previousContainer.data,
          this.availableColumns,
          event.previousIndex,
          event.currentIndex
        );
      }
    } else {
      // Moving between different table drop lists
      const targetTable = event.container.id.replace('List', '');
      const sourceTable = event.previousContainer.id.replace('List', '');
  
      if (this.columnAssignments[sourceTable] && this.columnAssignments[targetTable]) {
        transferArrayItem(
          event.previousContainer.data,
          this.columnAssignments[targetTable],
          event.previousIndex,
          event.currentIndex
        );
      }
    }
    //this.feedbackGiven = false;
  }
}
