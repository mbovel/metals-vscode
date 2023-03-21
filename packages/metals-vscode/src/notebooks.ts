import { TextDecoder, TextEncoder } from "util";
import * as vscode from "vscode";

export class ScalaNotebookSerializer implements vscode.NotebookSerializer {
  async deserializeNotebook(
    content: Uint8Array,
    _token: vscode.CancellationToken
  ): Promise<vscode.NotebookData> {
    const contents = new TextDecoder().decode(content);

    const cells: vscode.NotebookCellData[] = [];
    let currentValue = "";
    let currentLang = "";

    function push() {
      if (currentValue === "") return;

      if (currentLang === "scala") {
        cells.push(
          new vscode.NotebookCellData(
            vscode.NotebookCellKind.Code,
            currentValue,
            "scala"
          )
        );
      } else {
        cells.push(
          new vscode.NotebookCellData(
            vscode.NotebookCellKind.Markup,
            currentValue,
            "markdown"
          )
        );
      }
      currentValue = "";
    }

    for (const line of contents.split("\n")) {
      if (line === "//cell:") {
        push();
        currentLang = "scala";
      } else if (line.startsWith("///")) {
        if (currentLang === "scala") push();
        currentLang = "markdown";
        if (currentValue !== "") currentValue += "\n";
        currentValue += line.slice(4) + "\n";
      } else {
        if (currentLang === "markdown") push();
        currentLang = "scala";
        if (currentValue !== "") currentValue += "\n";
        currentValue += line;
      }
    }
    push();

    return new vscode.NotebookData(cells);
  }

  async serializeNotebook(
    data: vscode.NotebookData,
    _token: vscode.CancellationToken
  ): Promise<Uint8Array> {
    const content = data.cells
      .map((cell) => {
        if (cell.languageId === "scala") return "//cell:\n" + cell.value;
        else if (cell.languageId == "markdown")
          return "/// " + cell.value.replaceAll("\n", "\n/// ");
        else return "";
      })
      .join("\n");

    return new TextEncoder().encode(content);
  }
}
