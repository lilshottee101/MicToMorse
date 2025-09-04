import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve("src");
const OUTPUT_FILE = path.resolve("TODO.md");

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walkDir(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

function extractTodos(filePath) {
  const ext = path.extname(filePath);

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const todos = [];
  lines.forEach((line, index) => {
    if (line.includes("TODO:")) {
      todos.push({
        file: filePath,
        line: index + 1,
        text: line.trim()
      });
    }
  });

  return todos;
}

function generateTodoList() {
  const allTodos = [];

  walkDir(SRC_DIR, (filePath) => {
    const todos = extractTodos(filePath);
    allTodos.push(...todos);
  });

  if (allTodos.length === 0) {
    console.log("No TODOs found.");
    fs.writeFileSync(OUTPUT_FILE, "# TODO List\n\n_No TODOs found._\n");
    return;
  }

  let md = "# TODO List\n\n";
  allTodos.forEach((todo) => {
    md += `- [ ] ${todo.text} _(in ${path.relative(
      SRC_DIR,
      todo.file
    )}:${todo.line})_\n`;
  });

  fs.writeFileSync(OUTPUT_FILE, md, "utf-8");
  console.log(`TODO list generated at ${OUTPUT_FILE}`);
}

generateTodoList();
