import fs from "fs/promises";
import path from "path";

import xliff from "xliff";
import { AnnotationFactory } from "annotpdf";

import { PDFExtract } from "pdf.js-extract";
const pdfExtract = new PDFExtract();

async function main() {
  const argPath = process.argv.slice(2)[0];

  var data = await fs.readFile(argPath, "utf-8");
  const res = await xliff.xliff12ToJs(data);

  let pdfPath = argPath.substring(0, argPath.lastIndexOf(".xliff")) + ".pdf";
  let pdfPathNew =
    argPath.substring(0, argPath.lastIndexOf(".xliff")) + "_new.pdf";

  await addAnnotation(res, pdfPath, pdfPathNew);
  console.log("Completed All XLIFF Files");
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

async function addAnnotation(translationObj, pdfPath, pdfPathNew) {
  const offsetAmount = 20;

  const ns = translationObj.resources.namespace1;

  const sourcePDF = await pdfExtract.extract(pdfPath);
  const pages = sourcePDF.pages;

  AnnotationFactory.loadFile(pdfPath).then((factory) => {
    console.log(Object.entries(ns).length - 1);

    for (var key in ns) {
      let parsedNote = JSON.parse(ns[key].note);

      let pageHeight = pages[parsedNote.page].pageInfo.height;

      console.log(key);
      console.log(pageHeight);
      factory.createTextAnnotation({
        page: parsedNote.page,
        rect: [
          parsedNote.coords[0] - 20,
          pageHeight - parsedNote.coords[1] - 20 + offsetAmount,
          parsedNote.coords[0],
          pageHeight - parsedNote.coords[1] + offsetAmount,
        ],
        contents: ns[key].target,
        color: { r: 254, g: 208, b: 47 },
      });
    }
    factory.save(pdfPathNew);
    console.log("saved new pdf");
  });
}

main();
