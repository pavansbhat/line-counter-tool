const fs = require('fs');
const path = require('path');

class LanguageSyntax {
  constructor(name, singleLineComment, multiLineCommentStart = null, multiLineCommentEnd = null) {
    this.name = name;
    this.singleLineComment = singleLineComment;
    this.multiLineCommentStart = multiLineCommentStart;
    this.multiLineCommentEnd = multiLineCommentEnd;

    if (name.toLowerCase() === 'java' || name.toLowerCase().includes('c-like') || name.toLowerCase() === 'default (c-like)') {
      this.importPattern = /^\s*import\s+[\w\.\*]+;/;
      this.classDeclarationPattern = /^\s*(public|private|protected)?\s*(static\s+)?(final\s+)?(abstract\s+)?class\s+\w+(\s*<\s*[\w\s\?,&<>]+>)?(\s+extends\s+\w+)?(\s+implements\s+[\w\s,]+)?\s*\{?/;
      this.functionDeclarationPattern = /^\s*(public|private|protected|static|final|synchronized|abstract|native)*\s*[\w\.<>\[\]]+\s+\w+\s*\([\w\s\.<>\[\],:'"]*\)\s*(throws\s+[\w\s,]+)?\s*[\{;]?\s*$/;
      this.interfaceDeclarationPattern = /^\s*(public|private|protected)?\s*(abstract\s+)?interface\s+\w+(\s*<\s*[\w\s\?,&<>]+>)?(\s+extends\s+[\w\s,]+)?\s*\{?/;
    } else if (name.toLowerCase() === 'python') {
      this.importPattern = /^\s*(import\s+[\w\.]+(\s+as\s+\w+)?|from\s+[\w\.]+\s+import\s+([\w\.]+(\s+as\s+\w+)?|\*))/;
      this.classDeclarationPattern = /^\s*class\s+\w+\s*(\([\w\s\.,]*\))?:/;
      this.functionDeclarationPattern = /^\s*def\s+\w+\s*\([\w\s\*\.,=:'"]*\)\s*(->\s*[\w\.]+)?\s*:/;
    }
  }
}

const SYNTAXES = {
  java: new LanguageSyntax('Java', '//', '/*', '*/'),
  javascript: new LanguageSyntax('JavaScript', '//', '/*', '*/'),
  python: new LanguageSyntax('Python', '#', '"""', '"""'),
  c: new LanguageSyntax('C', '//', '/*', '*/'),
  cpp: new LanguageSyntax('C++', '//', '/*', '*/'),
  default: new LanguageSyntax('Default (C-like)', '//', '/*', '*/')
};

function getLanguageSyntax(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.java': return SYNTAXES.java;
    case '.js':
      if (!SYNTAXES.javascript.importPattern) {
        SYNTAXES.javascript.importPattern = /^\s*(import\s+.*from\s*['"].*['"];|const\s+\w+\s*=\s*require\(['"].*['"]\);)/;
        SYNTAXES.javascript.classDeclarationPattern = /^\s*(export\s+)?(default\s+)?class\s+\w+(\s+extends\s+\w+)?\s*\{?/;
        SYNTAXES.javascript.functionDeclarationPattern = /^\s*(async\s+)?(static\s+)?(function\*?\s+\w+\s*\(.*?\)|(\w+|constructor)\s*\(.*?\))\s*\{?/;
      }
      return SYNTAXES.javascript;
    case '.py': return SYNTAXES.python;
    case '.c': return SYNTAXES.c;
    case '.cpp': case '.cxx': case '.h': case '.hpp': return SYNTAXES.cpp;
    default:
      return SYNTAXES.default;
  }
}

function countLinesInFile(filePath, syntax) {
  if (!syntax) {
    console.error("Error: Syntax definition is missing.");
    return null;
  }

  let counts = {
    blank: 0, comments: 0, code: 0, total: 0,
    imports: 0, classDeclarations: 0, interfaceDeclarations: 0, functionDeclarations: 0,
  };

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    if (fileContent === '') return counts;

    const lines = fileContent.split(/\r?\n/);
    counts.total = lines.length;
    let inMultiLineComment = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        counts.blank++;
        continue;
      }

      let originalTrimmedLine = trimmedLine;
      let lineConsumedByMultiLine = false;

      if (syntax.multiLineCommentStart && syntax.multiLineCommentEnd) {
        let searchIndex = 0;
        let tempLineForMultiLineSearch = originalTrimmedLine;

        while (searchIndex < tempLineForMultiLineSearch.length) {
          if (inMultiLineComment) {
            const endMarkerIndex = tempLineForMultiLineSearch.indexOf(syntax.multiLineCommentEnd, searchIndex);
            if (endMarkerIndex !== -1) {
              inMultiLineComment = false;
              const partBefore = tempLineForMultiLineSearch.substring(0, searchIndex > 0 ? tempLineForMultiLineSearch.lastIndexOf(syntax.multiLineCommentStart, searchIndex -1) : 0);
              const partAfter = tempLineForMultiLineSearch.substring(endMarkerIndex + syntax.multiLineCommentEnd.length);

              if (partBefore.trim() === '' && partAfter.trim() === '') {
                lineConsumedByMultiLine = true;
              }

              originalTrimmedLine = partAfter.trim();
              if(originalTrimmedLine === '') lineConsumedByMultiLine = true;

              searchIndex = 0;
              if (lineConsumedByMultiLine) break;
              tempLineForMultiLineSearch = originalTrimmedLine;
              continue;
            } else {
              lineConsumedByMultiLine = true;
              break;
            }
          } else {
            const startMarkerIndex = tempLineForMultiLineSearch.indexOf(syntax.multiLineCommentStart, searchIndex);
            if (startMarkerIndex !== -1) {
              const codeBeforeComment = tempLineForMultiLineSearch.substring(searchIndex, startMarkerIndex).trim();
              const endMarkerIndexOnSameLine = tempLineForMultiLineSearch.indexOf(syntax.multiLineCommentEnd, startMarkerIndex + syntax.multiLineCommentStart.length);

              if (endMarkerIndexOnSameLine !== -1) {
                if (codeBeforeComment === '' && tempLineForMultiLineSearch.substring(endMarkerIndexOnSameLine + syntax.multiLineCommentEnd.length).trim() === '') {
                  lineConsumedByMultiLine = true;
                }
                originalTrimmedLine = codeBeforeComment + " " + tempLineForMultiLineSearch.substring(endMarkerIndexOnSameLine + syntax.multiLineCommentEnd.length);
                originalTrimmedLine = originalTrimmedLine.trim();
                searchIndex = 0;
                if(originalTrimmedLine === '') lineConsumedByMultiLine = true;
                if (lineConsumedByMultiLine) break;
                tempLineForMultiLineSearch = originalTrimmedLine;
                continue;
              } else {
                inMultiLineComment = true;
                if (codeBeforeComment === '') {
                  lineConsumedByMultiLine = true;
                }
                originalTrimmedLine = codeBeforeComment;
                break;
              }
            } else {
              break;
            }
          }
        }
      }


      if (lineConsumedByMultiLine) {
        counts.comments++;
        continue;
      }
      if (originalTrimmedLine === '') {
        counts.blank++;
        continue;
      }


      const singleLineCommentIndex = syntax.singleLineComment ? originalTrimmedLine.indexOf(syntax.singleLineComment) : -1;

      if (singleLineCommentIndex === 0) {
        counts.comments++;
      } else if (singleLineCommentIndex > 0 && originalTrimmedLine.substring(0, singleLineCommentIndex).trim() === '') {
        counts.comments++;
      }
      else {
        counts.code++;
        const codePart = singleLineCommentIndex > 0 ? originalTrimmedLine.substring(0, singleLineCommentIndex).trim() : originalTrimmedLine;

        if (syntax.importPattern && syntax.importPattern.test(codePart)) {
          counts.imports++;
        } else if (syntax.classDeclarationPattern && syntax.classDeclarationPattern.test(codePart)) {
          counts.classDeclarations++;
        } else if (syntax.interfaceDeclarationPattern && syntax.interfaceDeclarationPattern.test(codePart)) {
          counts.interfaceDeclarations++;
        } else if (syntax.functionDeclarationPattern && syntax.functionDeclarationPattern.test(codePart)) {
          if (!(syntax.classDeclarationPattern && syntax.classDeclarationPattern.test(codePart)) &&
            !(syntax.interfaceDeclarationPattern && syntax.interfaceDeclarationPattern.test(codePart))) {
            counts.functionDeclarations++;
          }
        }
      }
    }
    return counts;
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
    return null;
  }
}


function processPaths(paths) {
  let aggregatedCounts = {
    blank: 0, comments: 0, code: 0, total: 0, filesProcessed: 0,
    imports: 0, classDeclarations: 0, interfaceDeclarations: 0, functionDeclarations: 0,
  };
  const allFiles = [];

  function findFilesInDir(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (['node_modules', '.git', '.vscode', 'dist', 'build', '__pycache__'].includes(entry.name)) {
            continue;
          }
          findFilesInDir(fullPath);
        } else if (entry.isFile()) {
          allFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dirPath}: ${error.message}`);
    }
  }

  for (const p of paths) {
    try {
      if (!fs.existsSync(p)) {
        console.warn(`Warning: Path not found: ${p}. Skipping.`);
        continue;
      }
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        findFilesInDir(p);
      } else if (stat.isFile()) {
        allFiles.push(p);
      }
    } catch (error) {
      console.warn(`Warning: Could not process path ${p}: ${error.message}. Skipping.`);
    }
  }

  if (allFiles.length === 0 && paths.every(p => !fs.existsSync(p) || !fs.statSync(p).isFile())) {
    console.log("No processable files found in the specified paths.");
    return aggregatedCounts;
  }


  for (const filePath of allFiles) {
    const syntax = getLanguageSyntax(filePath);
    const fileCounts = countLinesInFile(filePath, syntax);
    if (fileCounts) {
      aggregatedCounts.blank += fileCounts.blank;
      aggregatedCounts.comments += fileCounts.comments;
      aggregatedCounts.code += fileCounts.code;
      aggregatedCounts.total += fileCounts.total;
      aggregatedCounts.filesProcessed++;
      aggregatedCounts.imports += (fileCounts.imports || 0);
      aggregatedCounts.classDeclarations += (fileCounts.classDeclarations || 0);
      aggregatedCounts.interfaceDeclarations += (fileCounts.interfaceDeclarations || 0);
      aggregatedCounts.functionDeclarations += (fileCounts.functionDeclarations || 0);
    }
  }
  return aggregatedCounts;
}

function main() {
  const inputPaths = process.argv.slice(2);
  if (inputPaths.length === 0) {
    console.log("Usage: node line_counter.js <file_path_or_directory_path> [another_path...]");
    console.log("\nDesign Considerations for Future Features are partially implemented or outlined in code comments.");
    process.exit(1);
  }

  const displayCounts = (counts, title) => {
    console.log(`\n--- ${title} ---`);
    if (counts.filesProcessed > 0) console.log(`Files Processed: ${counts.filesProcessed}`);
    console.log(`Blank Lines: ${counts.blank}`);
    console.log(`Comment Lines: ${counts.comments}`);
    console.log(`Code Lines: ${counts.code}`);
    console.log(`  Imports: ${counts.imports || 0}`);
    console.log(`  Class Declarations: ${counts.classDeclarations || 0}`);
    console.log(`  Interface Declarations: ${counts.interfaceDeclarations || 0}`);
    console.log(`  Function/Method Declarations: ${counts.functionDeclarations || 0}`);
    console.log(`Total Lines: ${counts.total}`);
  };

  let isSingleFileMode = false;
  if (inputPaths.length === 1) {
    try {
      if (fs.existsSync(inputPaths[0]) && fs.statSync(inputPaths[0]).isFile()) {
        isSingleFileMode = true;
      }
    } catch (e) {
      console.warn(`Warning: Could not determine if path is a file: ${inputPaths[0]}. Defaulting to multi-file mode.`);
    }
  }


  if (isSingleFileMode) {
    const filePath = inputPaths[0];
    const syntax = getLanguageSyntax(filePath);
    const counts = countLinesInFile(filePath, syntax);
    if (counts) {
      displayCounts(counts, `Results for: ${path.basename(filePath)}`);
    }
  } else {
    console.log(`Processing path(s): ${inputPaths.join(', ')}`);
    const aggregatedCounts = processPaths(inputPaths);
    if (aggregatedCounts.filesProcessed > 0 || (inputPaths.length > 0 && aggregatedCounts.total > 0) ) {
      displayCounts(aggregatedCounts, "Aggregated Totals");
    } else if (allFiles.length === 0 && inputPaths.length > 0) {
      console.log("No processable files found in the specified paths.");
    }
  }
}

main();