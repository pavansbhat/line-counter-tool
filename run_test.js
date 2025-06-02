const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const assert = require("assert");

const testFileName = "test_input.java";
const testFileContent = `import java.util.*;

// comment 1
// Comment 2

public class Main {

  // This is another comment line
  public static void main(String[] args) {
    System.out.println("Hello world!"); // code, not comment 11
  }
}`;

const expectedOutput = `
--- Results for: ${testFileName} ---
Blank Lines: 3
Comment Lines: 3
Code Lines: 6
  Imports: 1
  Class Declarations: 1
  Interface Declarations: 0
  Function/Method Declarations: 1
Total Lines: 12
`;

fs.writeFileSync(testFileName, testFileContent, "utf-8");
console.log(`Created test file: ${testFileName}`);

let actualOutput;
let testPassed = false;

try {
  actualOutput = execSync(`node line-counter-code.js ${testFileName}`, {
    encoding: "utf-8",
  });
  assert.strictEqual(
    actualOutput.trim(),
    expectedOutput.trim(),
    "Output mismatch",
  );

  console.log("\n========= TEST PASSED =========");
  console.log("Actual output matched expected output.");
  testPassed = true;
} catch (error) {
  console.error("\n========= TEST FAILED =========");
  if (error.stdout) {
    console.error("Actual Output (stdout):");
    console.error("--------------------------");
    console.error(error.stdout);
    console.error("--------------------------");
  } else if (actualOutput) {
    console.error("Actual Output:");
    console.error("--------------------------");
    console.error(actualOutput);
    console.error("--------------------------");
  }
  console.error("Expected Output:");
  console.error("--------------------------");
  console.error(expectedOutput);
  console.error("--------------------------");
  if (error.stderr) {
    console.error("Error Output (stderr from script):");
    console.error(error.stderr);
  }
  console.error("AssertionError or Exec Error:");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (fs.existsSync(testFileName)) {
    fs.unlinkSync(testFileName);
    console.log(`\nCleaned up test file: ${testFileName}`);
  }
}

if (testPassed && process.exitCode !== 1) {
  console.log("\nAll checks for this test case are green.");
}
