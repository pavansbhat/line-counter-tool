# Line Counter Tool

A command-line tool for counting lines of code, comments, and other metrics in source code files.

## Features

- Counts blank lines, comments, and code lines
- Detects imports, class declarations, interface declarations, and function declarations
- Supports multiple programming languages:
  - JavaScript
  - Java
  - Python
  - C
  - C++
- Handles both single files and directories
- Excludes common system directories (node_modules, .git, etc.)
- Supports both single-line and multi-line comments

## Installation

1. Ensure you have Node.js installed on your system
2. Clone or download this repository
3. No additional dependencies required

## Usage

### Basic Usage

### bash

`node line-counter-code.js <file_path1> <file_path2>`

## Output

### The tool will display

- Total number of files processed
- Number of blank lines
- Number of comment lines
- Number of code lines
- Number of imports
- Number of class declarations
- Number of interface declarations
- Number of function/method declarations
- Total lines

## Excluded Directories

### The following directories are automatically excluded

- node_modules
- .git
- .vscode
- dist
- build
- pycache

### Supported Comment Styles

- JavaScript/Java/C/C++: // for single-line, /\* \*/ for multi-line
- Python: # for single-line, """ for multi-line

```

```
