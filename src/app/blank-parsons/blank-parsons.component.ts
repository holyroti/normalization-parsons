import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { QuestionService } from '../services/question.service';
import { BlankQuestion, BlankTable, BlankColumn } from '../models/BlankModel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ToastrService } from 'ngx-toastr';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AppModalComponent } from '../app-modal/app-modal.component';
import { keywiseDialogues } from './keywiseDialogues';
import { ProfessorSpeechComponent } from "../professor-speech/professor-speech.component";

@Component({
  selector: 'app-blank-parsons',
  templateUrl: './blank-parsons.component.html',
  styleUrls: ['./blank-parsons.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, AppModalComponent, ProfessorSpeechComponent],
  animations: [
    trigger('slideIn', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      state('out', style({ opacity: 0, transform: 'translateY(-20px)' })),
      transition('out => in', animate('500ms ease-in')),
      transition('in => out', animate('500ms ease-out')),
    ]),
  ],
})
export class BlankComponent implements OnInit {

  // For professor speech etc.
  showProfessorModal: boolean = false;
  keyWiseDialogues = keywiseDialogues;
  toggleProfessorModal() {
    this.showProfessorModal = !this.showProfessorModal;
  }

  // Used for displaying a simplified game overview (if needed)
  gameInputTables: { 
    tableName: string; 
    availableColumnNames: string[]; 
    availableReferences: string[]; 
  }[] = [];

  @Input() questionId: number | null = null;
  @Output() completed: EventEmitter<void> = new EventEmitter<void>();
  @Input() stage: number | null = null;

  blankQuestions: BlankQuestion[] = [];
  currentQuestion: BlankQuestion | null = null;
  showTable: boolean = true;
  selectedQuestionID: number | null = null;
  showNextButton: boolean = false;

  // Dropdown lists
  predefinedTableNames: string[] = [];
  availableColumnNames: string[] = [];   // Flattened list of all available column names
  availableReferences: string[] = [];      // Flattened list for references (using table names here)

  // Holds the correct answer mapping (solution)
  solutionTables: BlankTable[] = [];

  // The student's working copy; column names start blank so that the dropdown doesn't prefill them
  userInputTables: BlankTable[] = [];

  // Feedback tracking
  feedbackGiven: boolean = false;
  highlightedStatus: { [column: string]: string | '' } = {};
  feedbackMessages: { [column: string]: string } = {};

  // Modals for instructions/summary
  showInstructionModal: boolean = false;
  showSummaryModal: boolean = false;
  instructionModalTitle = 'Instructions';
  SummaryModalTitle = 'Summary';
  instructionModalContent = "";
  summaryModalContent = "";

  showAnswers: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questionId'] && this.questionId) {
      console.log('Received questionId:', this.questionId);
      this.getBlankQuestionByID(this.questionId);
    }
  }

  toggleShowAnswers() {
    this.initSummaryModal();
  }

  closeInstructionModal() {
    this.showInstructionModal = false;
  }

  closeSummaryModal() {
    this.showSummaryModal = false;
  }

  initInstructionModal() {
    this.showInstructionModal = true;
    this.instructionModalContent = this.currentQuestion?.instructions || "";
  }

  initSummaryModal() {
    this.showSummaryModal = true;
    this.summaryModalContent = this.currentQuestion?.summary || "";
  }

  constructor(private questionService: QuestionService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadBlankQuestions();
    console.log(this.questionId);
  }

  async getBlankQuestionByID(questionId: number): Promise<void> {
    try {
      const response = await this.questionService.getBlankQuestionByID(questionId).toPromise();
      console.log('API Response:', response);
      if (response?.success && response.data) {
        // Use our mapping function to set currentQuestion and userInputTables
        this.mapDataToQuestion(response.data);
      } else {
        console.error('Invalid API response:', response);
      }
    } catch (err) {
      console.error('Error fetching blank question by ID:', err);
    }
  }

  mapDataToQuestion(data: any): void {
    const { question, tables, columns, feedback } = data;
    // Map the question fields
    this.currentQuestion = {
      questionId: question.questionID || 'N/A',
      sectionId: question.sectionID || 'N/A',
      htmlCode: question.html_code || '',
      hints: question.hints || '',
      instructions: question.instructions || '',
      question: question.question || '',
      summary: question.summary || '',
      tables: [],
      feedback: []
    };
  
    // Map tables: for each table, filter the columns that belong to it (using target_table)
    const mappedTables = tables.map((table: any) => {
      const columnsForTable = columns
        .filter((col: any) => col.target_table === table.target_table)
        .map((col: any) => ({
          id: col.ID,
          columnName: col.column_name,       // original column name from DB
          keyType: col.key_type,
          referencesTableId: col.references_tableID,
          target_table: col.target_table,
        }));
      if (columnsForTable.length === 0) {
        console.warn(`No columns found for table: ${table.target_table}`);
      }
      return {
        id: table.ID,
        targetTable: table.target_table,
        referencesTable: table.references_table,
        tableName: table.target_table, // for display purposes
        columns: columnsForTable,
      };
    });
  
    // Map feedback records.
    // Notice we use feed.feedback_columnID (the alias from our SQL) and store the joined column_name as expectedColumnName.
    const mappedFeedback = feedback.map((feed: any) => ({
      id: feed.ID,
      columnId: feed.feedback_columnID,         // using the alias from SQL query
      expectedColumnName: feed.column_name,       // the correct column name from the join
      targetTableId: feed.target_table_ID,
      expectedKeyType: feed.expected_key_type,
      expectedReferencesTableId: feed.expected_references_table_ID,
      feedback: feed.feedback,
      feedbackType: feed.feedback_type,
    }));
  
    // Assign mapped values to our current question model
    this.currentQuestion.tables = mappedTables;
    this.currentQuestion.feedback = mappedFeedback;
  
    console.log("Mapped Current Question:", this.currentQuestion);
  
    // Create the student's working copy.
    // Here we prefill the table names but leave the columnName fields empty for the student.
    this.initializeUserInputTables();
  }

  createDefaultColumn(tableId: number, columnId: number | null = null): BlankColumn {
    const id = columnId ?? Date.now();
    return {
      id: id,
      columnName: '',
      keyType: 'NONE',
      referencesTableId: null,
      target_table: '',
      columnId: columnId || null,
    };
  }

  loadBlankQuestions() {
    this.questionService.getBlankQuestions().subscribe({
      next: (response) => {
        if (response.success) {
          this.blankQuestions = response.data.map((q: any) => ({
            questionId: q.QUESTIONID,
            sectionId: q.SECTIONID,
            htmlCode: q.HTML_CODE,
            hints: q.HINTS,
            instructions: q.INSTRUCTIONS,
            question: q.QUESTION,
            tables: [],
            feedback: [],
            summary: q.SUMMARY,
          }));
          console.log('Mapped Blank Questions:', this.blankQuestions);
          if (this.blankQuestions.length > 0) {
            this.selectedQuestionID = this.blankQuestions[0].questionId;
            this.loadBlankDetails(this.selectedQuestionID);
          }
        }
      },
      error: (err) => console.error('Error fetching blank questions:', err),
    });
  }

  loadBlankDetails(questionId: number | undefined): void {
    const validQuestionId = questionId ?? 1;
    console.log('Fetching details for questionId:', validQuestionId);

    this.questionService.getBlankDetails(validQuestionId).subscribe({
      next: (response) => {
        if (response.success) {
          const { tables, feedback, columns } = response.data;
          // Build the flattened dropdown lists:
          this.predefinedTableNames = Array.from(new Set(tables.map((table: any) => table.TARGET_TABLE)));
          this.availableColumnNames = Array.from(new Set(columns.map((col: any) => col.COLUMN_NAME))).filter(name => name);
          this.availableReferences = Array.from(new Set(tables.map((table: any) => table.TARGET_TABLE))).filter(name => name);

          const questionFromList = this.blankQuestions.find((q) => q.questionId === validQuestionId);
          if (!questionFromList) {
            console.error('Question not found in blankQuestions:', validQuestionId);
            return;
          }

          // Map the fetched data into currentQuestion
          this.currentQuestion = {
            questionId: questionFromList.questionId,
            sectionId: questionFromList.sectionId,
            htmlCode: questionFromList.htmlCode,
            hints: questionFromList.hints,
            instructions: questionFromList.instructions,
            question: questionFromList.question,
            tables: tables.map((table: any) => {
              const columnsForTable = columns
                .filter((col: any) => col.TARGET_TABLE === table.TARGET_TABLE)
                .map((col: any) => ({
                  id: col.COLUMN_ID,
                  columnName: col.COLUMN_NAME,
                  keyType: col.KEY_TYPE,
                  referencesTableId: col.REFERENCES_TABLEID,
                  target_table: col.TARGET_TABLE,
                  columnId: col.COLUMN_ID,
                }));
              return {
                id: table.ID,
                targetTable: table.TARGET_TABLE,
                referencesTable: table.REFERENCES_TABLE,
                columns: columnsForTable.length > 0 ? columnsForTable : [this.createDefaultColumn(table.ID)],
              };
            }),
            feedback: feedback.map((feed: any) => {
              return {

                id: feed.ID,
                questionid: feed.QUESTIONID,
                target_table: feed.TARGET_TABLE,
                column_name: feed.COLUMN_NAME,
                expectedKeyType: feed.EXPECTED_KEY_TYPE,
                referencesTableId: feed.REFERENCES_TABLE_ID,
                feedback: feed.FEEDBACK,
                feedbackType: feed.FEEDBACK_TYPE
               
              };
            }),
            summary: questionFromList.summary,
          };

          this.solutionTables = JSON.parse(JSON.stringify(this.currentQuestion?.tables));
          this.initializeUserInputTables();
        } else {
          console.error('Invalid response from getBlankDetails:', response);
        }
      },
      error: (err) => console.error('Error fetching blank details:', err),
    });
  }


  initializeUserInputTables(): void {
    if (!this.currentQuestion || !this.currentQuestion.tables) {
      return;
    }
    // Deep copy each table but reset each column's columnName to an empty string.
    this.userInputTables = this.currentQuestion.tables.map(table => ({
      id: table.id,
      targetTable: table.targetTable,
      referencesTable: table.referencesTable,
      columns: table.columns.map((col: any) => ({
        id: col.id,
        columnId: col.id, // or use col.columnId if available
        columnName: '',   // clear the answer so the student must choose
        keyType: 'NONE' as 'PK' | 'FK' | 'NONE',
        referencesTableId: null,
        target_table: col.target_table,
      })),
    }));
  
    console.log("User Input Tables:", this.userInputTables);
  }
  // Optionally, a helper to retrieve the solution's column name
  getSolutionColumnName(tableIndex: number, columnIndex: number): string {
    return this.solutionTables?.[tableIndex]?.columns?.[columnIndex]?.columnName ?? '';
  }

 

  addColumn(tableIndex: number): void {
    if (!this.userInputTables[tableIndex]) {
      console.error(`Table at index ${tableIndex} does not exist in userInputTables.`);
      return;
    }
    const table = this.userInputTables[tableIndex];
    // Create a new blank column; you might also want to tie it to feedback if needed
    const newColumn = this.createDefaultColumn(table.id);
    table.columns.push(newColumn);
    console.log(`Added column to table at index ${tableIndex}:`, table);
  }

  removeColumn(tableIndex: number, columnIndex: number): void {
    const columns = this.userInputTables[tableIndex]?.columns;
    if (!columns) {
      console.error(`No columns found for table at index ${tableIndex}`);
      return;
    }
    if (columns.length > 1) {
      columns.splice(columnIndex, 1);
      console.log(`Removed column at index ${columnIndex} from table ${tableIndex}`);
    } else {
      console.warn(`Cannot remove the last column in table ${tableIndex}`);
    }
  }

  updateKeyType(tableIndex: number, columnIndex: number): void {
    const column = this.currentQuestion?.tables[tableIndex]?.columns[columnIndex];
    if (column?.keyType !== 'FK') {
      column!.referencesTableId = null;
    }
  }

  updateSelectedTables(tableIndex: number): void {
    console.log('Updated selected table for index:', tableIndex, this.currentQuestion?.tables);
  }

  isTableSelected(tableName: string): boolean {
    return this.currentQuestion?.tables.some((table) => table.targetTable === tableName) || false;
  }

  resetPuzzle(): void {
    this.initializeUserInputTables();
    this.toastr.info('The puzzle has been reset!', 'Reset Successful');
  }

  navigateToNextQuestion(): void {
    const currentIndex = this.blankQuestions.findIndex(
      (q) => q.questionId === this.currentQuestion?.questionId
    );
    const nextQuestion = this.blankQuestions[currentIndex + 1];
    this.showNextButton = !!nextQuestion;
    if (nextQuestion) {
      this.loadBlankDetails(nextQuestion.questionId);
    }
  }

  toggleTable(): void {
    this.showTable = !this.showTable;
  }

  toggleInstructionModal(): void {
    this.showInstructionModal = !this.showInstructionModal;
  }

  highlightColumn(columnIndex: number, status: 'correct' | 'incorrect' | 'neutral'): void {
    const columnId = this.userInputTables[columnIndex]?.columns[columnIndex]?.id;
    if (columnId) {
      this.highlightedStatus[columnId] = status;
      console.log(`Column with ID ${columnId} status set to ${status}`);
    }
  }

  // Called when the user clicks on the "Get Feedback" button.
  // getFeedback(): void {
  //   console.log("feedbac", JSON.stringify(this.currentQuestion?.feedback, null, 2));
  //   if (!this.currentQuestion || !this.currentQuestion.feedback) {
  //     console.error('No feedback found.');
  //     return;
  //   }
  
  //   // Reset previous feedback
  //   this.feedbackMessages = {};
  //   this.highlightedStatus = {};
  
  //   this.userInputTables.forEach((userTable) => {
  //     userTable.columns.forEach((assignedColumn) => {
  //       if (!assignedColumn.columnName || assignedColumn.columnName.trim() === '') {
  //         console.warn(`Column name is missing for ${userTable.targetTable}. Skipping feedback.`);
  //         return;
  //       }
  //       const feedbackKey = `${assignedColumn.columnName}_${userTable.targetTable}_${assignedColumn.keyType}`;
        
  //       // Find matching feedback based on table, expected column name, and key type.
  //       const matchingFeedback = this.currentQuestion?.feedback.find((fb) => {
  //         const tableMatch = fb.target_table === userTable.targetTable;
  //         const columnMatch = fb.column_name === assignedColumn.columnName;
  //         const keyTypeMatch = fb.expectedKeyType === assignedColumn.keyType;
  //         let referenceMatch = true;
  //         if (assignedColumn.keyType === 'FK') {
  //           referenceMatch = fb.referencesTableId === assignedColumn.referencesTableId;
  //         }
  //         return tableMatch && columnMatch && keyTypeMatch && referenceMatch;
  //       });
  
  //       if (matchingFeedback) {
  //         this.highlightedStatus[feedbackKey] = matchingFeedback.feedbackType; // e.g., "correct"
  //         this.feedbackMessages[feedbackKey] = matchingFeedback.feedback;
  //       } else {
  //         this.highlightedStatus[feedbackKey] = 'incorrect';
  //         this.feedbackMessages[feedbackKey] = `Incorrect: Your selection for ${assignedColumn.columnName} is not valid.`;
  //       }
  //     });
  //   });
  
  //   // Flag that feedback is now available and update UI accordingly.
  //   this.feedbackGiven = true;
  //   // Optionally enable next question button...
  // }
  
  

// Add these properties at the top of your component (if not already declared)
keyTypeFeedback: { [key: string]: string } = {};
referenceFeedback: { [key: string]: string } = {};

// Helper method to generate a base key (using the student's selected column name and table name)
getBaseKey(column: BlankColumn, table: BlankTable): string {
  return `${column.columnName}_${table.targetTable}`;
}

// We update getFeedbackKey to use getBaseKey so that our TS and HTML use the same key.
getFeedbackKey(column: BlankColumn, table: BlankTable): string {
  return this.getBaseKey(column, table);
}

// Revised getFeedback method with friendlier error messages:
getFeedback(): void {
  console.log("feedbac", JSON.stringify(this.currentQuestion?.feedback, null, 2));
  if (!this.currentQuestion || !this.currentQuestion.feedback) {
    console.error('No feedback found.');
    return;
  }

  // Reset previous feedback objects
  this.feedbackMessages = {};
  this.highlightedStatus = {};
  this.keyTypeFeedback = {};
  this.referenceFeedback = {};

  // Iterate through each table and its columns in the student's answers.
  this.userInputTables.forEach((userTable) => {
    userTable.columns.forEach((assignedColumn) => {
      if (!assignedColumn.columnName || assignedColumn.columnName.trim() === '') {
        console.warn(`Column name is missing for ${userTable.targetTable}. Skipping feedback.`);
        return;
      }

      // Use a unified key for storing/retrieving feedback
      const baseKey = this.getBaseKey(assignedColumn, userTable);

      // First, check if the column belongs to the table.
      const candidateFeedback = this.currentQuestion?.feedback.find((fb) =>
        fb.target_table === userTable.targetTable &&
        fb.column_name === assignedColumn.columnName
      );

      if (!candidateFeedback) {
        this.highlightedStatus[baseKey] = 'incorrect';
        this.feedbackMessages[baseKey] = `Incorrect: This column does not belong to the table ${userTable.targetTable}.`;
        return;
      }

      // Check if the student's key type matches the expected key type.
      if (candidateFeedback.expectedKeyType !== assignedColumn.keyType) {
        // Provide a more helpful error message.
        if (candidateFeedback.expectedKeyType === 'PK' && assignedColumn.keyType === 'FK') {
          this.keyTypeFeedback[baseKey] = "This column has the wrong key type. It should be marked as Primary Key.";
        } else if (candidateFeedback.expectedKeyType === 'FK' && assignedColumn.keyType === 'PK') {
          this.keyTypeFeedback[baseKey] = "This column should be marked as Foreign Key.";
        } else {
          this.keyTypeFeedback[baseKey] = "This column has the wrong key type. Try selecting the correct one.";
        }
        this.highlightedStatus[baseKey] = 'incorrect';
      } else {
        this.keyTypeFeedback[baseKey] = "";
      }

      // For foreign keys, check that the reference is correct.
      if (assignedColumn.keyType === 'FK') {
        if (candidateFeedback.referencesTableId !== assignedColumn.referencesTableId) {
          // If the expected reference is null, that means this column should not reference another table.
          if (candidateFeedback.referencesTableId === null) {
            this.referenceFeedback[baseKey] = "This column should not reference another table.";
          } else {
            this.referenceFeedback[baseKey] = "Incorrect reference: Please select the correct referenced table.";
          }
          this.highlightedStatus[baseKey] = 'incorrect';
        } else {
          this.referenceFeedback[baseKey] = "";
        }
      } else {
        this.referenceFeedback[baseKey] = "";
      }

      // If no key type or reference errors exist, mark as correct.
      if (!this.keyTypeFeedback[baseKey] && !this.referenceFeedback[baseKey]) {
        this.highlightedStatus[baseKey] = candidateFeedback.feedbackType; // e.g., "correct"
        this.feedbackMessages[baseKey] = candidateFeedback.feedback;
      } else {
        // Combine any error messages.
        let combinedError = "";
        if (this.keyTypeFeedback[baseKey]) {
          combinedError += this.keyTypeFeedback[baseKey] + " ";
        }
        if (this.referenceFeedback[baseKey]) {
          combinedError += this.referenceFeedback[baseKey];
        }
        this.feedbackMessages[baseKey] = combinedError.trim();
      }
    });
  });

  console.log("Feedback Messages:", this.feedbackMessages);
  console.log("Key Type Errors:", this.keyTypeFeedback);
  console.log("Reference Errors:", this.referenceFeedback);
  console.log("Highlighted Status:", this.highlightedStatus);

  // Indicate that feedback is now available and update UI accordingly.
  this.feedbackGiven = true;

  // Optionally, if all feedback is correct, enable the "Next Question" button.
  const total = Object.keys(this.feedbackMessages).length;
  const correctCount = Object.values(this.highlightedStatus).filter(status => status === 'correct').length;
  this.showNextButton = (total > 0 && correctCount === total);
}

// Helper methods for HTML display:
isFeedbackCorrect(column: BlankColumn, table: BlankTable): boolean {
  return this.highlightedStatus[this.getBaseKey(column, table)] === 'correct';
}

isFeedbackIncorrect(column: BlankColumn, table: BlankTable): boolean {
  return this.highlightedStatus[this.getBaseKey(column, table)] === 'incorrect';
}


}
