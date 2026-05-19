const { PDFDocument } = require("pdf-lib");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const PDF = require("../models/PDF");
const {
  chooseDuplicateContext,
  softDeleteHistoryUpdate,
} = require("./pdfWorkflow");

const optimizePdf = async (buffer) => {
  try {
    const pdfDoc = await PDFDocument.load(buffer);

    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");

    const optimizedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
    });

    return Buffer.from(optimizedPdfBytes);
  } catch (err) {
    console.error("PDF optimization failed:", err);
    return buffer;
  }
};

const uploadPdfBuffer = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "pdfs",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.log("Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log("UPLOAD RESULT:", result.secure_url);
          resolve(result);
        }
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

const replacePdfFile = async (pdf, fileBuffer, fileHash) => {
  await cloudinary.uploader.destroy(pdf.cloudinaryId, {
    resource_type: "raw",
  });

  const uploadResult = await uploadPdfBuffer(fileBuffer);
  pdf.url = uploadResult.secure_url;
  pdf.cloudinaryId = uploadResult.public_id;
  pdf.fileHash = fileHash;
};

const deletePdfDocument = async (pdf) => {
  if (!pdf?._id) return;
  if (pdf.url) {
    try {
      await cloudinary.uploader.destroy(pdf.cloudinaryId, {
        resource_type: "raw",
      });
    } catch (err) {
      console.error("Cloudinary destroy failed:", err.message);
    }
  }
  await PDF.findByIdAndDelete(pdf._id);
};

const softDeletePdfForLibrary = async (pdf, reviewerId, reason) => {
  Object.assign(pdf, softDeleteHistoryUpdate({ reviewerId, reason }));
  await pdf.save();
};

const findDuplicateContext = async (duplicateQuery) => {
  const duplicates = await PDF.find(duplicateQuery)
    .populate("submittedBy", "username role")
    .populate("reviewedBy", "username role")
    .sort({ createdAt: -1 });

  return chooseDuplicateContext(duplicates);
};

module.exports = {
  deletePdfDocument,
  findDuplicateContext,
  optimizePdf,
  replacePdfFile,
  softDeletePdfForLibrary,
  uploadPdfBuffer,
};
