const ja = {
  upload: {
    title: "ドキュメントのアップロード",
    subtitle: "高度なOCR技術でドキュメントをアップロードして処理します。",
    process: "ドキュメントを処理",
    processingButton: "処理中...",
    dragDrop: {
      title: "ここにファイルをドラッグ＆ドロップ、またはクリックして参照",
      supported: "対応形式: PDF, JPG, PNG, DOCX",
      browse: "ファイルを選択"
    },
 
    uploadedFiles: "アップロードされたファイル",
    processButton: "OCRで処理",
    processingText: "処理中...",
    errorFile: "ファイルのアップロードに失敗しました。エラー内容を確認してください。",
    noFiles: "まだファイルがアップロードされていません。上にファイルをドロップしてください。",
 
    uploadFailed: "アップロード失敗",
    uploadSuccess: "アップロード成功",
    uploadStatus: "アップロード状況",
 
    howItWorks: {
      title: "使い方",
      step1: {
        title: "アップロード＆スキャン",
        desc: "ファイルをアップロードすると、OCRが自動的にスキャンします。"
      },
      step2: {
        title: "抽出＆確認",
        desc: "抽出されたテキストを確認し、必要に応じて修正します。"
      },
      step3: {
        title: "エクスポート",
        desc: "処理済みデータをさまざまな形式でエクスポートできます。"
      }
    },
 
    modalProcessing: {
      title: "ドキュメント処理中",
      desc: "ドキュメントを抽出・分析しています。しばらくお待ちください...",
       progress:"進捗",
      phrases: [
        "ドキュメント構造を解析中...",
        "OCRを使用してテキストを抽出中...",
        "精度を上げるために画像品質を向上中...",
        "AIを使用して翻訳中...",
        "100%正確な結果が出るまでお待ちください..."
      ]
    },
 
    modalSuccess: {
      title: "アップロード成功",
      desc: "対応形式（PDF、JPG、PNG、DOCX）のドキュメントをアップロードしてください。"
    },
 
    modalExtracted: {
      title: "抽出完了",
      desc: "AIエンジンがテキストとデータを自動的に抽出しました。"
    },
 
    modalExport: {
      title: "エクスポート",
      desc: "結果を確認し、お好みの形式でエクスポートしてください。"
    }
  },
 
  exportData: {
    title: "データのエクスポート",
    subtitle: "処理済みドキュメントのダウンロードと管理",
    searchPlaceholder: "ドキュメントを検索...",
    filters: "フィルター",
    fileType: "ファイル形式",
    allDocuments: "すべてのドキュメント",
    images: "画像",
    pdfs: "PDF",
    otherDocs: "その他のドキュメント",
    dateRange: "日付の範囲",
    from: "開始",
    to: "終了",
    clear: "クリア",
    date: "日付:",
    size: "サイズ:",
    confidence: "信頼度:",
    noData: "利用可能なドキュメントがありません。",
    deleteModalTitle: "ドキュメントを削除",
    deleteModalMessage: "このドキュメントを削除してもよろしいですか？この操作は元に戻せません。",
    cancel: "キャンセル",
    delete: "削除",
    deleting: "削除中..."
  },
 
 
  results: {
    title: "処理結果",
    subtitle: "処理済み結果をダウンロード",
    preview: "ドキュメントプレビュー",
 
    originalDocument: "元のドキュメント",
    extractedText: "抽出されたテキスト",
    translatedText: "翻訳されたテキスト",
 
    copyText: "テキストをコピー",
    tabularData: "表データ",
    copyTable: "表をコピー",
 
    back: "戻る",
    regenerating: "再生成中...",
    regenerateResults: "結果を再生成",
 
    table: {
      item: "項目",
      price: "価格（JPY）",
      quantity: "数量",
      total: "合計（JPY）"
    },
 
    actions: {
      regenerate: "再生成",
      verifyAll: "すべて確認",
      exportExcel: "Excelにエクスポート",
      exportPDF: "PDFにエクスポート",
      exportText: "テキストとしてエクスポート",
      newUpload: "新しいファイルをアップロード"
    },
 
    report: {
      title: "OCR抽出レポート",
      desc: "生成日",
      extracted: "元の抽出テキスト",
      translated: "翻訳されたテキスト（日本語）",
      table: "表データ"
    },
 
    alerts: {
      noDocument: "再生成するドキュメントがありません。",
      extractionFailed: "抽出に失敗しました。",
      excelFailed: "Excelファイルの作成に失敗しました。"
    },
 
    defaults: {
      noText: "テキストが抽出されませんでした。",
      noTranslation: "翻訳結果がありません。"
    }
  }
};
 
export default ja;