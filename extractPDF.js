import { PDFExtract } from "pdf.js-extract";
import fs from "fs";
import path from "path";
import pkg from "docx";
const { Paragraph, TextRun, Document, SectionType, Packer } = pkg;
const pdfExtract = new PDFExtract();
// const options: PDFExtractOptions = {}; /* see below */

async function main() {
  const argPath = process.argv.slice(2)[0];

  let allFilePaths = getFiles(argPath);

  let pdfOnly = allFilePaths.filter((item) => {
    return path.extname(item) === ".pdf";
  });

  pdfOnly.forEach((element) => {
    extract(element);
  });

  console.log("Completed All PDF Files");
}

function getFiles(Directory) {
  let Files = [];

  function throughDirectory(Directory) {
    fs.readdirSync(Directory).forEach((File) => {
      const Absolute = path.join(Directory, File);
      if (fs.statSync(Absolute).isDirectory())
        return throughDirectory(Absolute);
      else return Files.push(Absolute);
    });
  }

  throughDirectory(Directory);
  return Files;
}

async function extractTxt(filePath) {
  var options = {
    normalizeWhitespace: false,
    disableCombineTextItems: true, // default:`false` - do not attempt to combine  same line {@link TextItem}'s.
  };

  var result = await pdfExtract.extract(filePath, options);

  var pages = result.pages;
  var docContent = "";
  for (let i = 0; i < pages.length; i++) {
    const element = pages[i];
    var pageContent = "";

    for (let c = 0; c < element.content.length; c++) {
      if (c > 0 && element.content[c].y !== element.content[c - 1].y) {
        pageContent = pageContent + "\n";
      }

      pageContent = pageContent + element.content[c].str;
    }

    let re1 = /(\n)([a-z])/gm;
    pageContent = pageContent.replace(re1, " $2");

    let re15 = /(\n)((\s)[a-z])/gm;
    pageContent = pageContent.replace(re15, "$2");

    let re155 = /([a-z])(\n)((\s)[A-Z])/gm;
    pageContent = pageContent.replace(re155, "$1$3");

    let re3 = /(\n)(-)(\n)([^A-Z])/gm;
    pageContent = pageContent.replace(re3, "$2$4");
    let re2 = /(-)(\n)/gm;
    pageContent = pageContent.replace(re2, "$1 ");
    let re25 = /(,)(\n)/gm;
    pageContent = pageContent.replace(re25, "$1 ");

    let re4 = /\.([A-Z])/gm;
    pageContent = pageContent.replace(re4, ". $1");

    pageContent = pageContent.replace(/  +/gm, " ");

    docContent =
      docContent + pageContent + "\n\n" + "--------------------" + "\n\n";

    docPages = pageContent;
  }

  let destPath = filePath.substr(0, filePath.lastIndexOf(".pdf")) + ".txt";

  fs.writeFileSync(destPath, docContent);

  console.log("completed", destPath);
}

async function extract(filePath) {
  var options = {
    normalizeWhitespace: false,
    disableCombineTextItems: true, // default:`false` - do not attempt to combine  same line {@link TextItem}'s.
  };

  var result = await pdfExtract.extract(filePath, options);

  var pages = result.pages;
  var docPages = [];
  for (let i = 0; i < pages.length; i++) {
    const element = pages[i];
    var pageContent = "";

    for (let c = 0; c < element.content.length; c++) {
      if (c > 0 && element.content[c].y !== element.content[c - 1].y) {
        pageContent = pageContent + "\n";
      }

      pageContent = pageContent + element.content[c].str;
    }

    let re1 = /(\n)([a-z])/gm;
    pageContent = pageContent.replace(re1, " $2");

    let re15 = /(\n)((\s)[a-z])/gm;
    pageContent = pageContent.replace(re15, "$2");

    let re155 = /([a-z])(\n)((\s)[A-Z])/gm;
    pageContent = pageContent.replace(re155, "$1$3");

    let re3 = /(\n)(-)(\n)([^A-Z])/gm;
    pageContent = pageContent.replace(re3, "$2$4");
    let re2 = /(-)(\n)/gm;
    pageContent = pageContent.replace(re2, "$1 ");
    let re25 = /(,)(\n)/gm;
    pageContent = pageContent.replace(re25, "$1 ");

    let re4 = /\.([A-Z])/gm;
    pageContent = pageContent.replace(re4, ". $1");

    pageContent = pageContent.replace(/  +/gm, " ");

    var pars = pageContent.split("\n");

    var parObjects = [];
    for (let p = 0; p < pars.length; p++) {
      const parText = pars[p];
      parObjects.push(
        new Paragraph({
          children: [new TextRun(parText)],
        })
      );
    }

    docPages.push(parObjects);
  }

  let destPath = filePath.substr(0, filePath.lastIndexOf(".pdf")) + ".docx";
  createDocx(destPath, docPages);
}

function createDocx(destPath, paragraphObj) {
  var sectionsArray = paragraphObj.map((item) => {
    return {
      children: item,
    };
  });

  const doc = new Document({
    sections: sectionsArray,
  });

  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(destPath, buffer);
  });

  console.log("Wrote DOCX", destPath);
}

main();
