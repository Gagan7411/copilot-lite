import * as Diff from 'diff';

export interface ParsedHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface ParsedDiff {
  oldFileName: string;
  newFileName: string;
  hunks: ParsedHunk[];
}

export function parseUnifiedDiff(diffText: string): ParsedDiff | null {
  const lines = diffText.split('\n');
  let oldFileName = '';
  let newFileName = '';
  const hunks: ParsedHunk[] = [];
  let currentHunk: ParsedHunk | null = null;

  for (const line of lines) {
    if (line.startsWith('---')) {
      oldFileName = line.substring(4).trim();
    } else if (line.startsWith('+++')) {
      newFileName = line.substring(4).trim();
    } else if (line.startsWith('@@')) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (match) {
        currentHunk = {
          oldStart: parseInt(match[1], 10),
          oldLines: match[2] ? parseInt(match[2], 10) : 1,
          newStart: parseInt(match[3], 10),
          newLines: match[4] ? parseInt(match[4], 10) : 1,
          lines: []
        };
      }
    } else if (currentHunk) {
      currentHunk.lines.push(line);
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  if (hunks.length === 0) {
    return null;
  }

  return {
    oldFileName,
    newFileName,
    hunks
  };
}

export function applyPatch(original: string, diffText: string): string | null {
  try {
    const result = Diff.applyPatch(original, diffText);
    if (result === false) {
      return null;
    }
    return result;
  } catch (error) {
    console.error('Error applying patch:', error);
    return null;
  }
}

export function createUnifiedDiff(
  original: string,
  modified: string,
  originalName: string = 'original',
  modifiedName: string = 'fixed'
): string {
  const patch = Diff.createPatch(originalName, original, modified, '', '');
  return patch;
}

export interface TextEdit {
  startLine: number;
  endLine: number;
  newText: string;
}

export function diffToEdits(original: string, diffText: string): TextEdit[] | null {
  const parsed = parseUnifiedDiff(diffText);
  if (!parsed) {
    return null;
  }

  const edits: TextEdit[] = [];

  for (const hunk of parsed.hunks) {
    let oldLineNum = hunk.oldStart;
    let newLineNum = hunk.newStart;
    const newLines: string[] = [];

    let startLine = oldLineNum - 1;
    let endLine = oldLineNum - 1;

    for (const line of hunk.lines) {
      const firstChar = line[0];

      if (firstChar === '-') {
        endLine = oldLineNum;
        oldLineNum++;
      } else if (firstChar === '+') {
        newLines.push(line.substring(1));
        newLineNum++;
      } else {
        oldLineNum++;
        newLineNum++;
      }
    }

    if (newLines.length > 0 || startLine !== endLine) {
      edits.push({
        startLine,
        endLine,
        newText: newLines.join('\n')
      });
    }
  }

  return edits;
}

export function validatePatch(original: string, diffText: string): boolean {
  const result = applyPatch(original, diffText);
  return result !== null;
}
