"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  UploadCloud,
  ScanLine,
  FileText,
  Download,
  CheckCircle,
  X,
  File,
  Loader2,
  AlertCircle,
} from "lucide-react";
import client from "@/lib/supabaseClient";
import { useAuth } from "@/app/components/context/AuthProvider";

const UploadIcon = () => <UploadCloud className="text-foreground w-12 h-12" />;
const ScanIcon = () => <ScanLine className="text-foreground w-10 h-10 mb-4" />;
const ExtractIcon = () => (
  <FileText className="text-foreground w-10 h-10 mb-4" />
);
const ExportIcon = () => (
  <Download className="text-foreground w-10 h-10 mb-4" />
);

export default function DocumentUpload() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadResults, setUploadResults] = useState({ success: 0, failed: 0 });
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const addFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileStatuses((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const processOCR = async (file) => {
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

    let response;
    try {
      response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: base64Data,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        throw new Error("API Request timed out after 5 minutes.");
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";
    text = text
      .replace(/^```[a-z]*\n/i, "")
      .replace(/\n```$/i, "")
      .trim();

    try {
      const parsedJson = JSON.parse(text);
      let cleanTableData = parsedJson.tableData || [];
      if (Array.isArray(cleanTableData)) {
        cleanTableData = cleanTableData.filter(
          (row) =>
            !Object.keys(row).some(
              (k) => k.includes("Product Name") || k.includes("Term"),
            ),
        );
      }

      return {
        extractedText: parsedJson.extractedText || "No text extracted",
        translatedText: parsedJson.translatedText || "No translation generated",
        tableData: cleanTableData,
      };
    } catch (e) {
      console.warn(
        "Gemini output was not valid JSON, falling back to raw text:",
        text,
      );
      return {
        extractedText: text || "No text extracted",
        translatedText: "Could not translate document (Invalid JSON returned).",
        tableData: [],
      };
    }
  };

  const handleProcess = async () => {
    if (files.length === 0 || !user) return;

    setIsProcessing(true);
    setUploadComplete(false);
    setProcessingProgress(0);
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 5;
      });
    }, 500);
    let successCount = 0;
    let failedCount = 0;
    const extractedResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setFileStatuses((prev) => ({ ...prev, [i]: "uploading" }));

      try {
        const timestamp = Date.now();
        const filePath = `${user.id}/${timestamp}_${file.name}`;

        try {
          const { error: uploadError } = await client.storage
            .from("documents")
            .upload(filePath, file);

          if (uploadError) {
            console.warn(
              "Storage upload issue (bypassed):",
              uploadError.message,
            );
          }
        } catch (e) {
          console.warn("Storage exception bypassed:", e);
        }

        let documentId = null;
        try {
          const { data: dbData, error: dbError } = await client
            .from("documents")
            .insert({
              user_id: user.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type,
              status: "pending",
            })
            .select()
            .single();

          if (dbError)
            throw new Error("DB Document Insert Error: " + dbError.message);
          documentId = dbData.id;
        } catch (dbErr) {
          console.error("CRITICAL DB Insert blocked:", dbErr.message);
          alert("Database Save Failed: " + dbErr.message);
          throw dbErr;
        }

        try {
          const ocrResult = await processOCR(file);
          const extractedText = ocrResult.extractedText;
          const translatedText = ocrResult.translatedText;

          if (documentId) {
            const { error: ocrError } = await client.from("results").insert({
              document_id: documentId,
              extracted_text: extractedText,
              translated_text: translatedText,
              table_data: ocrResult.tableData,
            });

            if (ocrError) {
              console.error("Results Table Error:", ocrError.message);
              alert("OCR Results Save Failed: " + ocrError.message);
            }

            await client
              .from("documents")
              .update({ status: "completed" })
              .eq("id", documentId);
          } else {
            console.log(
              "Local OCR Extraction Success:",
              extractedText.substring(0, 50) + "...",
            );
          }

          const { data: signedUrlData, error: signedUrlError } =
            await client.storage
              .from("documents")
              .createSignedUrl(filePath, 3600);

          let imageUrl = null;
          if (signedUrlData && signedUrlData.signedUrl) {
            imageUrl = signedUrlData.signedUrl;
          } else {
            console.warn(
              "Failed to create signed URL. Falling back to public URL.",
              signedUrlError,
            );
            const { data: publicUrlData } = client.storage
              .from("documents")
              .getPublicUrl(filePath);
            imageUrl = publicUrlData ? publicUrlData.publicUrl : null;
          }
          
          if (!imageUrl && file) {
             imageUrl = URL.createObjectURL(file);
          }

          extractedResults.push({
            documentId: documentId,
            fileName: file.name,
            filePath: filePath,
            text: extractedText,
            translatedText: translatedText,
            tableData: ocrResult.tableData,
            imageUrl: imageUrl,
          });

          setFileStatuses((prev) => ({ ...prev, [i]: "done" }));
          successCount++;
        } catch (ocrErr) {
          console.error(`OCR failed for ${file.name}:`, ocrErr);
          await client
            .from("documents")
            .update({ status: "failed" })
            .eq("id", documentId);
          throw ocrErr;
        }
      } catch (err) {
        console.error(`Upload/Insert failed for ${file.name}:`, err.message);
        setFileStatuses((prev) => ({ ...prev, [i]: "error" }));
        alert(`Processing error for ${file.name}. Please try again.`);
        failedCount++;
      }
    }

    clearInterval(progressInterval);
    setProcessingProgress(100);

    setUploadResults({ success: successCount, failed: failedCount });
    setUploadComplete(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 500);

    if (successCount > 0) {
      localStorage.setItem(
        "latestOcrResults",
        JSON.stringify(extractedResults),
      );
      router.push("/results");
    }
  };

  const getStatusIcon = (index) => {
    const status = fileStatuses[index];
    if (status === "uploading")
      return <Loader2 size={20} className="text-primary animate-spin" />;
    if (status === "done")
      return <CheckCircle size={20} className="text-green-500" />;
    if (status === "error")
      return <AlertCircle size={20} className="text-red-500" />;
    return <CheckCircle size={20} className="text-green-500" />;
  };

  return (
    <div className="min-h-full bg-background flex flex-col p-4 sm:p-6">
      <div className="max-w-[1920px] mx-auto w-full flex flex-col">
        <div className="mb-4 shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
           {t("upload.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("upload.subtitle")}
          </p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition-colors mb-8 sm:mb-12 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px]
            ${dragActive ? "border-primary bg-accent/20" : "border-border bg-card"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            id="file-upload"
            onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            multiple
          />

          <div className="flex flex-col items-center justify-center gap-6">
            <div className="bg-accent p-4 rounded-full">
              <UploadIcon />
            </div>

            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">
               {t("upload.dragDrop.title")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("upload.dragDrop.supported")}
              </p>
            </div>

            <label
              htmlFor="file-upload"
              className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium cursor-pointer hover:bg-primary/90 transition-colors"
            >
              {t("upload.dragDrop.browse")}
            </label>
          </div>
        </div>

        {files.length > 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 mb-12 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {t("upload.uploadedFiles")} ({files.length})
              </h2>
              <button
                onClick={handleProcess}
                disabled={isProcessing || uploadComplete || !user}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {isProcessing ? t("upload.processingButton") : t("upload.process")}
              </button>
            </div>

            {uploadComplete && uploadResults.failed > 0 && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                {uploadResults.failed} {t("upload.errorFile")}
              </div>
            )}

            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={file.name + "-" + index}
                  suppressHydrationWarning
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    fileStatuses[index] === "error"
                      ? "bg-red-50 dark:bg-red-500/10"
                      : fileStatuses[index] === "done"
                        ? "bg-green-50 dark:bg-green-500/10"
                        : "bg-accent/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border text-muted-foreground">
                      <File size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                        {fileStatuses[index] === "error" && (
                          <span className="text-red-500 ml-2">
                            {t("upload.uploadFailed")}
                          </span>
                        )}
                        {fileStatuses[index] === "done" && (
                          <span className="text-green-600 ml-2">
                         {t("upload.uploadSuccess")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusIcon(index)}
                    {!isProcessing && !uploadComplete && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-foreground p-1"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground mb-12">
            <p>{t("upload.noFiles")}</p>
          </div>
        )}

        <div className="mb-12">
          <h2 className="text-xl font-bold text-center mb-5">
            {t("upload.howItWorks.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 border border-border bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <ScanIcon />
              <div className="text-2xl font-bold mb-2 mt-2 text-foreground">
                1
              </div>
              <h3 className="font-bold mb-3 text-foreground">{t("upload.uploadStatus")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
              {t("upload.modalSuccess.desc")}
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 border border-border bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <ExtractIcon />
              <div className="text-2xl font-bold mb-2 mt-2 text-foreground">
                2
              </div>
              <h3 className="font-bold mb-3 text-foreground">{t("upload.modalExtracted.title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
              {t("upload.modalExtracted.desc")}
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 border border-border bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <ExportIcon />
              <div className="text-2xl font-bold mb-2 mt-2 text-foreground">
                3
              </div>
              <h3 className="font-bold mb-3 text-foreground">{t("upload.modalExport.title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
               {t("upload.modalExport.desc")}
              </p>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div suppressHydrationWarning className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200 border border-border">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-muted rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-card p-4 rounded-full border-2 border-muted">
                  <Loader2 className="w-12 h-12 text-foreground animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 text-center">
                {t("upload.modalProcessing.title")}
              </h3>
              <p className="text-muted-foreground text-sm text-center mb-6 min-h-[40px] px-2 transition-opacity duration-300">
                {Array.isArray(t("upload.modalProcessing.phrases", { returnObjects: true })) 
                  ? t("upload.modalProcessing.phrases", { returnObjects: true })[
                      currentPhraseIndex % 
                      t("upload.modalProcessing.phrases", { returnObjects: true }).length
                    ]
                  : t("upload.modalProcessing.desc")}
              </p>

              <div className="w-full mb-2 flex justify-between items-center text-sm font-medium text-foreground">
                <span>{t("upload.modalProcessing.progress")}</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-border">
                <div
                  className="h-full bg-foreground transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, processingProgress))}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
