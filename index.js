import { PDFExtract } from "pdf.js-extract";
import fs from "fs";
const pdfExtract = new PDFExtract();
// const options: PDFExtractOptions = {}; /* see below */

async function main() {
  var result = await pdfExtract.extract("test.pdf");

  var pages = result.pages;

  for (let i = 0; i < pages.length; i++) {
    console.log("Page", i);
    const element = pages[i];

    var pageContent = "";

    for (let c = 0; c < element.content.length; c++) {
      pageContent = pageContent + element.content[c].str + "\n";
    }

    fs.writeFileSync(`./out/page${i}.txt`, pageContent);
  }
  console.log("completed");
}
main();
