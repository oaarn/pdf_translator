import fs from "fs/promises";
import path from "path";

import xliff from "xliff";
import { AnnotationFactory } from "annotpdf";

async function main() {
  const argPath = process.argv.slice(2)[0];

  var data = await fs.readFile(argPath, "utf-8");
  const res = await xliff.xliff12ToJs(data);

  let pdfPath = argPath.substring(0, argPath.lastIndexOf(".xliff")) + ".pdf";
  let pdfPathNew =
    argPath.substring(0, argPath.lastIndexOf(".xliff")) + "_new.pdf";

  addAnnotation(res, pdfPath, pdfPathNew);
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

function addAnnotation(translationObj, pdfPath, pdfPathNew) {
  const ns = translationObj.resources.namespace1;

  AnnotationFactory.loadFile(pdfPath).then((factory) => {
    for (var key in ns) {
      let parsedNote = JSON.parse(ns[key].note);
      factory.createTextAnnotation({
        page: parsedNote.page,
        rect: [
          parsedNote.coords[0] - 20,
          792 - parsedNote.coords[1] - 20,
          parsedNote.coords[0],
          792 - parsedNote.coords[1],
        ],
        contents: ns[key].source,
        color: { r: 254, g: 208, b: 47 },
      });
    }
    factory.save(pdfPathNew);
  });
}

main();
