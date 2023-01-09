import { PDFExtract } from "pdf.js-extract";
import fs from "fs";
import path from "path";
import pkg from "docx";

import xliff from "xliff";
const { Paragraph, TextRun, Document, SectionType, Packer } = pkg;
const pdfExtract = new PDFExtract();

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

    var pars = [];

    var pageContent = "";

    for (let c = 0; c < element.content.length; c++) {
      if (
        c < element.content.length - 1 &&
        element.content[c].y !== element.content[c + 1].y
      ) {
        // if it is just a single Number break teh sentence
        if (element.content[c].str.match(/\d+/) && pageContent === "") {
          pageContent = pageContent + element.content[c].str;

          pars.push({
            text: pageContent,
            x: element.content[c].x,
            y: element.content[c].y,
            page: i,
          });

          pageContent = "";
        }

        // if it does not end with punctuation then do not break the sentence
        else if (
          element.content[c].str
            .charAt(element.content[c].str.length - 1)
            .match(/[.!?]/)
        ) {
          pageContent = pageContent + element.content[c].str;

          pars.push({
            text: pageContent,
            x: element.content[c].x,
            y: element.content[c].y,
            page: i,
          });

          pageContent = "";
        } else {
          pageContent = pageContent + element.content[c].str;
        }
      } else if (c == element.content.length - 1) {
        pageContent = pageContent + element.content[c].str;

        pars.push({
          text: pageContent,
          x: element.content[c].x,
          y: element.content[c].y,
          page: i,
        });
        pageContent = "";
      } else {
        pageContent = pageContent + element.content[c].str;
      }
    }

    for (let p = 0; p < pars.length; p++) {
      docPages.push(pars[p]);
    }
  }

  let destPath = filePath.substr(0, filePath.lastIndexOf(".pdf")) + ".xliff";

  await createXLIFF(destPath, docPages);
}

async function parObjToJSON(paragraphObj) {
  var sourceJS = {};
  var targetJS = {};
  var notes = {};
  for (let i = 0; i < paragraphObj.length; i++) {
    const textItem = paragraphObj[i].text;
    const coords = [paragraphObj[i].x, paragraphObj[i].y];
    const page = paragraphObj[i].page;

    sourceJS[`key${i}`] = textItem;
    targetJS[`key${i}`] = "";
    notes[`key${i}`] = JSON.stringify({ page: page, coords: coords });
  }
  return { sourceObj: sourceJS, targetObj: targetJS, notes: notes };
}

async function createXLIFF(destPath, paragraphObj) {
  const jsonPars = await parObjToJSON(paragraphObj);

  const res = await xliff.createxliff12(
    "en-US",
    "pt-BR",
    jsonPars.sourceObj,
    jsonPars.targetObj,
    "namespace1",
    null,
    jsonPars.notes
  );

  fs.writeFileSync(destPath, res);
  console.log("Wrote xliff", destPath);
}
main();
