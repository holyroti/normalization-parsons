export interface BlankQuestion {
  questionId: number;
  sectionId: number;
  htmlCode: string;
  hints: string;
  instructions: string;
  question: string;
  tables: BlankTable[];
  feedback: BlankFeedback[];
  summary: string;
}

export interface BlankTable {
  id: number;
  targetTable: string;
  referencesTable: string | null; // Null if no references
  columns: BlankColumn[]; // Columns mapped to this table
}

export interface BlankColumn {
  id: number;
  columnId: number | null;
  columnName: string;
  keyType: 'PK' | 'FK' | 'NONE'; // Restricted to valid types
  referencesTableId: number | null; // Null if no references
  target_table: string;

  feedbackMessage?: string;  // Added feedback message property
  feedbackType?: string;     // Added feedback type property
  expectedKeyType?: 'PK' | 'FK' | 'NONE'; // Added expected key type property
  expectedReferencesTableId?: number | null; // Added expected references table ID
}

export interface BlankFeedback {
  id: number;
  questionid: number,
  target_table: string;
  column_name: string;
  expectedKeyType: 'PK' | 'FK' | 'NONE';
  //references_table: string;
  referencesTableId: number | null;
  feedback: string;
  feedbackType: string;
}

