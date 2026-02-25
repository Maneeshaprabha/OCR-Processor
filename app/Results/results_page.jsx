"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RefreshCw,
  CheckCircle,
  Search,
  Scan,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import client from "@/lib/supabaseClient";
import { useAuth } from "@/app/components/context/AuthProvider";
import { useRouter } from "next/navigation";

export default function ProcessedResults() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const reportRef = useRef(null);
  const extractedRef = useRef(null);
  const translatedRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isMounted, setIsMounted] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const logExportEvent = async (format) => {
    if (!user) return;
    try {
      await client.from("export_history").insert({
        user_id: user.id,
        export_type: format,
        file_path: `export_${format}_${Date.now()}`,
      });
    } catch (e) {
      console.error("Failed to log export", e);
    }
  };

  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!documentUrl) {
      alert("No document available to regenerate.");
      return;
    }
    setIsRegenerating(true);
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const geminiResponse = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: `data:${blob.type};base64,${base64Data}`,
        }),
      });

      if (!geminiResponse.ok) throw new Error("API Connection Failed");

      const rawData = await geminiResponse.json();
      let text = rawData.choices?.[0]?.message?.content || "";
      text = text
        .replace(/^```[a-z]*\n/i, "")
        .replace(/\n```$/i, "")
        .trim();
      let parsedJson;
      try {
        parsedJson = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid format returned by Model");
      }

      let cleanTableData = parsedJson.tableData || [];
      if (Array.isArray(cleanTableData)) {
        cleanTableData = cleanTableData.filter(
          (row) =>
            !Object.keys(row).some(
              (k) => k.includes("Product Name") || k.includes("Term"),
            ),
        );
      }

      setExtractedContent(parsedJson.extractedText || "No text extracted");
      setTranslatedContent(parsedJson.translatedText || "No translation");
      setTableData(cleanTableData);

      const storedResults = localStorage.getItem("latestOcrResults");
      let documentId = null;
      if (storedResults) {
        const parsed = JSON.parse(storedResults);
        if (parsed && parsed.length > 0) {
          parsed[0].text = parsedJson.extractedText;
          parsed[0].translatedText = parsedJson.translatedText;
          parsed[0].tableData = cleanTableData;
          documentId = parsed[0].documentId;
          localStorage.setItem("latestOcrResults", JSON.stringify(parsed));
        }
      }

      if (documentId) {
        await client
          .from("results")
          .update({
            extracted_text: parsedJson.extractedText,
            translated_text: parsedJson.translatedText,
            table_data: cleanTableData,
          })
          .eq("document_id", documentId);
      }
    } catch (e) {
      console.error("Regeneration error:", e);
      alert("Extraction failed: " + e.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const [extractedContent, setExtractedContent] = useState("");
  const [translatedContent, setTranslatedContent] = useState("");
  const [tableData, setTableData] = useState([]);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [documentType, setDocumentType] = useState("image");

  useEffect(() => {
    const fetchInitialData = async () => {
      const storedResults = localStorage.getItem("latestOcrResults");
      if (storedResults) {
        try {
          const parsed = JSON.parse(storedResults);
          if (parsed && parsed.length > 0) {
          const combinedText = parsed.map((p) => p.text).join("\n\n");
          const combinedTranslated = parsed
            .map((p) => p.translatedText)
            .join("\n\n");

          setExtractedContent(combinedText);
          setTranslatedContent(combinedTranslated);

          let combinedTableData = parsed.flatMap((p) => p.tableData || []);
          combinedTableData = combinedTableData.filter(
            (row) =>
              !Object.keys(row).some(
                (k) => k.includes("Product Name") || k.includes("Term"),
              ),
          );
          setTableData(combinedTableData);

          if (parsed[0].imageUrl) {
            let urlToUse = parsed[0].imageUrl;
            const refName = (parsed[0].fileName || urlToUse || "").toLowerCase();
            
            // Try to generate a fresh signed URL if we have the filePath
            const filePath = parsed[0].filePath;
            if (filePath) {
              try {
                const { data } = await client.storage.from("documents").createSignedUrl(filePath, 3600);
                if (data && data.signedUrl) {
                  urlToUse = data.signedUrl;
                } else {
                  const { data: publicData } = client.storage.from("documents").getPublicUrl(filePath);
                  if (publicData && publicData.publicUrl) {
                    urlToUse = publicData.publicUrl;
                  }
                }
              } catch (e) {
                console.warn("Failed to get fresh url from path", e);
              }
            }

            setDocumentUrl(urlToUse);
            if (refName.includes(".pdf")) {
              setDocumentType("pdf");
            } else if (refName.includes(".docx") || refName.includes(".doc")) {
              setDocumentType("docx");
            } else {
              setDocumentType("image");
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse local results", e);
      }
    }
    };
    fetchInitialData();
  }, []);
  const { t } = useTranslation();
  useEffect(() => {
    if (!canvasRef.current) return;

    let isMounted = true;
    let fabricCanvas;

    import("fabric").then((fabricModule) => {
      if (!isMounted) return;

      const fabric = fabricModule.default || fabricModule;

      const CanvasClass = fabric.Canvas || fabric.fabric.Canvas;
      const ImageClass = fabric.Image || fabric.fabric.Image;

      if (!CanvasClass) {
        console.error("Could not load Fabric Canvas");
        return;
      }

      const containerWidth = containerRef.current?.clientWidth || 400;
      const containerHeight = containerRef.current?.clientHeight || 600;

      fabricCanvas = new CanvasClass(canvasRef.current, {
        width: containerWidth,
        height: containerHeight,
        backgroundColor: "transparent",
        selection: false,
      });

      setCanvas(fabricCanvas);

      let canvasImageUrl = documentUrl;
      
      if (!canvasImageUrl) {
        canvasImageUrl =
          "https://placehold.co/400x550/png?text=No+Preview+Available";
      }

      const htmlImg = new window.Image();
      htmlImg.crossOrigin = "anonymous";
      htmlImg.onload = () => {
        if (!isMounted || !fabricCanvas) return;

        try {
          const fabricImg = new fabric.Image(htmlImg);

          if (!fabricImg.width || !fabricImg.height) return;

          const cw = fabricCanvas.width;
          const ch = fabricCanvas.height;
          const scaleX = (cw - 20) / fabricImg.width;
          const scaleY = (ch - 20) / fabricImg.height;
          const scale = Math.min(scaleX, scaleY);

          fabricImg.set({
            selectable: false,
            evented: false,
            scaleX: scale,
            scaleY: scale,
          });

          fabricCanvas.add(fabricImg);
          fabricCanvas.centerObject(fabricImg);
          fabricCanvas.renderAll();
        } catch (e) {
          console.error("Fabric failed to process loaded image", e);
        }
      };
      htmlImg.onerror = (e) => {
        console.warn("Failed to load image natively, CORS or network error blocks canvas.");
        if (htmlImg.src !== "https://placehold.co/400x550/png?text=Preview+Blocked") {
           htmlImg.src = "https://placehold.co/400x550/png?text=Preview+Blocked";
        }
      };
      setTimeout(() => {
          htmlImg.src = canvasImageUrl;
      }, 0);
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (!fabricCanvas) return;

        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          fabricCanvas.setDimensions({ width, height });

          const objects = fabricCanvas.getObjects();
          if (objects.length > 0 && objects[0].type === "image") {
            const img = objects[0];
            const scaleX = (width - 20) / img.width;
            const scaleY = (height - 20) / img.height;
            const scale = Math.min(scaleX, scaleY);

            img.set({
              scaleX: scale,
              scaleY: scale,
            });
            fabricCanvas.centerObject(img);
          }
          fabricCanvas.renderAll();
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
      setCanvas(null);
    };
  }, [documentUrl]);

  useEffect(() => {
    if (!canvas) return;
    canvas.setZoom(zoom / 100);
    const vpt = canvas.viewportTransform;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    vpt[4] = centerX - centerX * (zoom / 100);
    vpt[5] = centerY - centerY * (zoom / 100);
    canvas.requestRenderAll();
  }, [zoom, canvas]);



  const handleZoom = (newZoom) => {
    setZoom(newZoom);
  };

  const handleCopy = (ref) => {
    if (ref.current) {
      navigator.clipboard.writeText(ref.current.innerText);
    }
  };

  const handleCopyTable = () => {
    if (!tableData || tableData.length === 0) return;

    const headers = Object.keys(tableData[0])
      .map((key) => key.replace(/([A-Z])/g, " $1").trim())
      .join("\t");

    const rows = tableData.map((row) => Object.values(row).join("\t"));

    const TSVContent = [headers, ...rows].join("\n");

    navigator.clipboard.writeText(TSVContent);
  };

  const exportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "OCR Automation System";
      workbook.created = new Date();

      // --- SHEET 1: Tabular Data ---
      if (tableData && tableData.length > 0) {
        const tableSheet = workbook.addWorksheet("Tabular Data");

        // Extract all unique headers across all rows
        const headers = Array.from(new Set(tableData.flatMap(Object.keys)));

        // Setup Header Row Styling
        const headerRow = tableSheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F46E5" }, // Primary Indigo color
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 25;

        tableData.forEach((row) => {
          const rowData = headers.map((key) => row[key] || "");
          const addedRow = tableSheet.addRow(rowData);
          addedRow.alignment = { vertical: "middle", wrapText: true };
        });

        tableSheet.columns.forEach((column) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = maxLength < 15 ? 15 : Math.min(maxLength + 2, 80); // cap width at 80
        });
      }

      const textSheet = workbook.addWorksheet("Extracted & Translated Text");
      textSheet.getColumn(1).width = 150;

      const extTitle = textSheet.addRow(["Original Extracted Text"]);
      extTitle.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      extTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF374151" },
      };
      extTitle.height = 30;
      extTitle.alignment = { vertical: "middle", indent: 1 };

      const extContent = textSheet.addRow([
        extractedRef.current?.innerText || "No text",
      ]);
      extContent.alignment = { wrapText: true, vertical: "top", indent: 1 };

      const extLines = (extractedRef.current?.innerText || "").split(
        "\n",
      ).length;
      const extLength = (extractedRef.current?.innerText || "").length;
      extContent.height = Math.max(100, extLines * 15 + (extLength / 120) * 15);

      textSheet.addRow([]);

      const trTitle = textSheet.addRow(["Translated Text (Japanese)"]);
      trTitle.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      trTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF10B981" },
      }; // Emerald color
      trTitle.height = 30;
      trTitle.alignment = { vertical: "middle", indent: 1 };

      const trContent = textSheet.addRow([
        translatedRef.current?.innerText || "No translation",
      ]);
      trContent.alignment = { wrapText: true, vertical: "top", indent: 1 };

      const trLines = (translatedRef.current?.innerText || "").split(
        "\n",
      ).length;
      const trLength = (translatedRef.current?.innerText || "").length;
      trContent.height = Math.max(100, trLines * 15 + (trLength / 120) * 15);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `OCR_Results_${new Date().getTime()}.xlsx`);

      logExportEvent("excel");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Failed to build Excel file.");
    }
  };

  const exportPDF = () => {
    window.print();
    logExportEvent("pdf");
  };

  const exportText = () => {
    const text = `EXTRACTED TEXT:\n${extractedRef.current?.innerText || ""}\n\nTRANSLATED TEXT:\n${translatedRef.current?.innerText || ""}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "results_text.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logExportEvent("txt");
  };

  if (!isMounted) {
    return <div className="h-full bg-background flex flex-col p-4 sm:p-6" />;
  }

  return (
    <>
      <div className="h-full bg-background flex flex-col p-4 sm:p-6 overflow-y-auto lg:overflow-hidden print:hidden">
        <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col">
          <div className="mb-4 shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("results.title")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground"></p>
          </div>

          <div
            ref={contentRef}
            className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:flex-1 lg:min-h-0 bg-background p-2 rounded-xl"
          >
            <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col h-[500px] lg:h-[calc(100vh-10rem)] lg:sticky lg:top-6 overflow-hidden shrink-0">
              <div className="p-3 border-b border-border font-semibold text-muted-foreground text-sm">
                {t("results.preview")}
              </div>

              <div className="flex-1 bg-accent/30 relative overflow-hidden flex items-center justify-center p-4">
                <div
                  ref={containerRef}
                  className="relative w-full h-full flex items-center justify-center overflow-hidden bg-muted/50 rounded-lg border border-border"
                >
                  {documentType === "pdf" && documentUrl ? (
                    <iframe
                      src={`${documentUrl}#view=FitH`}
                      className="w-full h-full border-0"
                      title="PDF Document Preview"
                    />
                  ) : documentType === "docx" && documentUrl ? (
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
                      className="w-full h-full border-0"
                      title="Word Document Preview"
                    />
                  ) : (
                    <div key={`canvas-wrapper-${documentUrl || 'empty'}`} className="w-full h-full flex items-center justify-center">
                      <canvas ref={canvasRef} />
                    </div>
                  )}
                </div>
              </div>

              <div className="h-12 border-t border-border bg-card flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <Search size={16} />
                  </button>
                  <button
                    onClick={() => handleZoom(Math.max(10, zoom - 10))}
                    className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <Scan size={16} />
                  </button>
                  <button className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <Maximize size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-1 justify-end max-w-xs">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={zoom}
                    onChange={(e) => handleZoom(Number(e.target.value))}
                    className="w-24 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-xs text-muted-foreground font-medium min-w-[2.5rem] text-right">
                    {zoom}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 h-auto lg:h-full lg:overflow-hidden">
              <div className="lg:flex-1 flex flex-col gap-6 lg:min-h-0 shrink-0">
                <div className="flex flex-col h-[300px] lg:h-auto lg:flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-foreground text-sm">
                      {t("results.extractedText")}
                    </h3>
                  </div>
                  <div className="flex-1 border border-border rounded-lg bg-card overflow-hidden relative group">
                    <div
                      ref={extractedRef}
                      contentEditable
                      suppressHydrationWarning
                      suppressContentEditableWarning
                      dangerouslySetInnerHTML={{ __html: extractedContent ? extractedContent.replace(/\n/g, "<br/>") : "" }}
                      className="w-full h-full p-4 bg-card text-sm text-foreground focus:outline-none overflow-y-auto font-mono leading-relaxed pb-10"
                      spellCheck="false"
                    />
                    <button
                      onClick={() => handleCopy(extractedRef)}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-card/50 backdrop-blur-sm px-2 py-1 rounded-md border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Copy size={14} /> {t("results.copyText")}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col h-[300px] lg:h-auto lg:flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-foreground text-sm">
                     {t("results.translatedText")}                   
                      </h3>
                  </div>
                  <div className="flex-1 border border-border rounded-lg bg-card overflow-hidden relative group">
                    <div
                      ref={translatedRef}
                      contentEditable
                      suppressHydrationWarning
                      suppressContentEditableWarning
                      dangerouslySetInnerHTML={{ __html: translatedContent ? translatedContent.replace(/\n/g, "<br/>") : "" }}
                      className="w-full h-full p-4 bg-card text-sm text-foreground focus:outline-none overflow-y-auto font-sans leading-relaxed pb-10"
                      spellCheck="false"
                    />
                    <button
                      onClick={() => handleCopy(translatedRef)}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-card/50 backdrop-blur-sm px-2 py-1 rounded-md border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Copy size={14} /> {t("results.copyText")}
                    </button>
                  </div>
                </div>
              </div>

              {tableData.length > 0 && (
                <div className="flex flex-col shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-foreground text-sm">
                      {t("results.tabularData")}
                    </h3>
                    <button
                      onClick={handleCopyTable}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Copy size={14} /> {t("results.copyTable")}
                    </button>
                  </div>
                  <div className="border border-border rounded-lg bg-card overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left">
                      <thead className="bg-accent/50 text-muted-foreground font-medium text-xs border-b border-border">
                        <tr>
                          {Array.from(
                            new Set(tableData.flatMap(Object.keys)),
                          ).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 font-medium whitespace-nowrap"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-foreground">
                        {tableData.map((row, index) => (
                          <tr
                            key={`row-${index}-${Math.random().toString(36).substring(7)}`}
                            suppressHydrationWarning
                            className="hover:bg-accent/30 transition-colors"
                          >
                            {Array.from(
                              new Set(tableData.flatMap(Object.keys)),
                            ).map((key, i) => (
                              <td key={i} className="px-6 py-4">
                                {row[key] || ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end shrink-0 bg-card p-4 rounded-xl border border-border shadow-sm">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors cursor-pointer"
                >
                  {isRegenerating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  {isRegenerating
                    ? t('results.regenerating') 
                    : t('results.regenerateResults')}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 shrink-0 bg-card border border-border rounded-xl p-2 flex items-center gap-3 shadow-sm ">
            <button
              onClick={exportExcel}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              {t("results.actions.exportExcel")}
            </button>
            <button
              onClick={exportPDF}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm cursor-pointer"
            >
              {t("results.actions.exportPDF")}
            </button>
            <button
              onClick={exportText}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm cursor-pointer"
            >
              {t("results.actions.exportText")}
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm cursor-pointer"
             onClick={() => router.push('/upload')}
            >
              {t("results.back")}
            </button>
          </div>
        </div>
      </div>

      <div
        className="hidden print:block w-full bg-white text-black px-[15mm] pt-[15mm] pb-[15mm] font-sans"
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      >
        <style type="text/css" media="print">{`
          @page { size: auto; margin: 0mm !important; }
          body, html { margin: 0 !important; padding: 0 !important; background-color: white !important; height: auto !important; overflow: visible !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; overflow: visible !important; }
          .page-break { page-break-before: always !important; display: block !important; width: 100% !important; }
          table { page-break-inside: auto !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
        `}</style>
        <div className="mb-8 border-b-2 border-indigo-600 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("results.report.title")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("results.report.desc")} {new Date().toLocaleString()}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold border border-slate-700 text-slate-800 bg-slate-100 px-4 py-2 mb-4">
            {t("results.report.extracted")}
          </h2>
          <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed px-4 pb-4 border-l-4 border-slate-700">
            {extractedRef.current?.innerText ||
              extractedContent ||
              "No text extracted."}
          </div>
        </div>

        <div className="mb-8 pt-[15mm] page-break">
          <h2 className="text-xl font-bold border border-emerald-600 text-emerald-800 bg-emerald-50 px-4 py-2 mb-4">
            {t("results.report.translated")}
          </h2>
          <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed px-4 pb-4 border-l-4 border-emerald-600">
            {translatedRef.current?.innerText ||
              translatedContent ||
              "No translation available."}
          </div>
        </div>

        {tableData && tableData.length > 0 && (
          <div className="mb-0 pt-[15mm] page-break">
            <h2 className="text-xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-700 pb-2">
              {t("results.report.table")}
            </h2>
            <table className="w-full text-sm text-left border-collapse border border-slate-300">
              <thead
                className="bg-indigo-100 text-indigo-950 font-semibold border-b-2 border-indigo-700"
                style={{
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                <tr className="bg-white border-none">
                  <th
                    colSpan="100"
                    className="h-[15mm] bg-white border-none p-0"
                  ></th>
                </tr>
                <tr>
                  {Array.from(new Set(tableData.flatMap(Object.keys))).map(
                    (key) => (
                      <th
                        key={key}
                        className="px-4 py-3 border border-indigo-700 align-middle"
                      >
                        {key}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {tableData.map((row, index) => (
                  <tr
                    key={index}
                    className="odd:bg-white even:bg-slate-50 break-inside-avoid"
                  >
                    {Array.from(new Set(tableData.flatMap(Object.keys))).map(
                      (key, i) => (
                        <td
                          key={i}
                          className="px-4 py-3 border border-slate-300 align-middle"
                        >
                          {row[key] || ""}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white border-none">
                <tr>
                  <td
                    colSpan="100"
                    className="h-[15mm] bg-white border-none p-0"
                  ></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
