import { NextResponse } from 'next/server';

// export const maxDuration = 300; 
// export const dynamic = "force-dynamic"; 

// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '10mb',
//     },
//   },
// };

export async function POST(req) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL or base64 data is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const geminiResponse = await fetch("https://automation.sonasu.jp/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'You are a professional OCR system for a Japanese client. Extract ALL text from this document accurately in its original language. Preserve formatting, lists, and structure. Then, translate the extracted text to Japanese. If there are tables in the document, extract them into an array of objects. CRITICAL: You MUST use the EXTREMELY EXACT column headers visually present in the document itself as the JSON keys (e.g., if the document header says "Start Date", use exactly "Start Date" as the key, with spaces included!). DO NOT use generic keys like "Column1". DO NOT camelCase the keys. CRITICAL RULE: If a table is split into multiple parts, DO NOT hallucinate, carry over, or inherit column headers (like "Product Name", "Term", "Net Price") from previous tables unless they are physically printed above the current cells. Output ONLY a valid JSON object matching exactly this structure: { "extractedText": "original text here", "translatedText": "translated text here", "tableData": [{"Genuine Header 1": "Value1", "Genuine Header 2": "Value2"}] }. If no tables exist, return an empty array for tableData. Do not output anything else. No markdown wrappers.',
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return NextResponse.json({ error: `Downstream API Error: ${geminiResponse.status} - ${errText}` }, { status: geminiResponse.status });
    }

    const data = await geminiResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("OCR API Route Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
