export interface Question {
    id: number;
    section: string; // Section name or ID
    question: string; // The text of the question
    code: string[]; // The lines of code or fragments for the Parsons problem
    correctOrder: string[]; // The correct order of the code fragments
    hints: string; // Hints for solving the problem
    feedback: { [key: string]: string }; // Feedback for each line or option (keyed by index or identifier)
    imagepath: string; // Path to the associated image for the question
    orderDoesNotMatter: boolean
  }
  