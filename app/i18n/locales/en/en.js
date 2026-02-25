const en = {
  upload: {
    title: "Document Upload",
    subtitle: "Upload and process your documents with our advanced OCR technology.",
    process: "Process Documents",
    processingButton: "Processing...",
    dragDrop: {
      title: "Drag and drop files here or click to browse",
      supported: "Supported formats: PDF, JPG, PNG, DOCX",
      browse: "Browse Files"
    },
 
    uploadedFiles: "Uploaded Files",
    processButton: "Process with OCR",
    processingButton: "Processing...",
    errorFile: "file(s) failed to upload. Check the errors below.",
    noFiles: "No files uploaded yet. Drop files above to get started.",
    uploadFailed: "— Upload failed.",
    uploadSuccess: "— Upload successful.",
    uploadStatus: "Upload",
 
    howItWorks: {
      title: "How It Works",
      step1: {
        title: "Upload & Scan",
        desc: "Drop your files and Mu OCR will automatically scan them."
      },
      step2: {
        title: "Extract & Verify",
        desc: "Review the extracted text and make any necessary corrections."
      },
      step3: {
        title: "Export",
        desc: "Export your processed data in various formats."
      }
    },
 
    modal: {
      title: "Processing Documents",
      desc: "Please wait while we extract and analyze your documents..."
    },
 
    modalSuccess: {
      title: "Success",
      desc: "Your documents were uploaded successfully."
    },
 
    modalExtracted: {
      title: "Text Extracted",
      desc: "Our AI engine automatically extracts text and data from your documents."
    },
 
    modalExport: {
      title: "Export",
      desc: "Review the results and export the data in your preferred format."
    },
 
    modalProcessing: {
      title: "Processing Documents...",
      desc: "Uploading and extracting text using AI...",
       progress:"Progress",
      phrases: [
        "Analyzing document structure...",
        "Extracting text using OCR...",
        "Enhancing image quality for precision...",
        "Translating content with AI...",
        "Please wait for 100% accurate results..."
      ]
    }
  },
 
 
  results: {
    title: "Processed Results",
    preview: "Document Preview",
    subtitle: "Download your processed results",
 
    originalDocument: "Original Document",
    extractedText: "Extracted Text",
    translatedText: "Translated Text",
    copyText: "Copy Text",
 
    tabularData: "Tabular Data",
    copyTable: "Copy Table",
 
    regenerating: "Regenerating extraction...",
    regenerateResults: "Regenerate Results",
 
    back: "Back",
 
    table: {
      item: "Item",
      price: "Price (JPY)",
      quantity: "Quantity",
      total: "Total (JPY)"
    },
 
    actions: {
      regenerate: "Regenerate",
      verifyAll: "Verify All",
      exportExcel: "Export to Excel",
      exportPDF: "Export to PDF",
      exportText: "Export as Text",
      newUpload: "Upload New File"
    },
 
    report: {
      title: "OCR Extraction Report",
      desc: "Generated on",
      extracted: "Original Extracted Text",
      translated: "Translated Text (Japanese)",
      table: "Tabular Data"
    },
 
    alerts: {
      noDocument: "No document available to regenerate.",
      extractionFailed: "Extraction failed.",
      excelFailed: "Failed to build Excel file."
    },
 
    defaults: {
      noText: "No text extracted.",
      noTranslation: "No translation available."
    }
  }
}
 
export default en