import { getUploadedFile } from "@/lib/storage";

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  supportsVision: boolean;
  isFree: boolean;
  isRecommended?: boolean;
}

export interface AIReviewResult {
  language: string;
  status: "CORRECT" | "NEEDS_REVISION" | "RETRY" | "INCORRECT";
  suggestedScore: number;
  summary: string;
  issues: string[];
  strengths: string[];
  teacherFeedback: string;
  correctedCode: string;
  extractedCode?: string;
  modelUsed: string;
}

export interface AIOCRResult {
  language: string;
  code: string;
  modelUsed: string;
}

// In-memory cache for models
let cachedModels: OpenRouterModelInfo[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000;

export function getOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY topilmadi. Iltimos, .env faylida OPENROUTER_API_KEY ni sozlang."
    );
  }
  return key.trim();
}

/**
 * 100% Free Primary Vision and Text Models on OpenRouter
 */
export const PRIMARY_FREE_VISION_MODELS = [
  "inclusionai/ling-3.0-flash-vl:free", // #1 Eng tez va aniq bepul Vision model (JavaScript/OOP/kodni o'qiydi)
  "openrouter/free",                   // Rasmiy bepul router (Vision qo'llab-quvvatlaydi)
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", // Bepul multimodal omni
  "openrouter/auto",                   // Bepul avtomatik marshrut
];

export const PRIMARY_FREE_TEXT_MODELS = [
  "inclusionai/ling-3.0-flash-sante:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3.5-lightning:free",
  "cohere/north-mini-code:free",
  "openrouter/free",
];

/**
 * Fetch live models from OpenRouter and accurately identify 100% FREE models with Vision
 */
export async function getLiveModels(forceRefresh = false): Promise<{
  models: OpenRouterModelInfo[];
  freeVisionModels: OpenRouterModelInfo[];
  freeTextModels: OpenRouterModelInfo[];
  visionCount: number;
  freeCount: number;
}> {
  const now = Date.now();
  if (!forceRefresh && cachedModels && now - cacheTimestamp < CACHE_TTL_MS) {
    const freeVision = cachedModels.filter((m) => m.isFree && m.supportsVision);
    const freeText = cachedModels.filter((m) => m.isFree && !m.supportsVision);
    return {
      models: cachedModels,
      freeVisionModels: freeVision,
      freeTextModels: freeText,
      visionCount: cachedModels.filter((m) => m.supportsVision).length,
      freeCount: cachedModels.filter((m) => m.isFree).length,
    };
  }

  const apiKey = getOpenRouterApiKey();
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://mars-it-school.uz",
      "X-Title": "Mars IT School Platform",
    },
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter modellarni yuklashda xatolik: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const rawModels = (data.data || []) as Array<{
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    architecture?: {
      modality?: string;
      input_modalities?: string[];
    };
    pricing?: {
      prompt?: string | number;
      completion?: string | number;
    };
  }>;

  const parsedModels: OpenRouterModelInfo[] = rawModels.map((m) => {
    const inputMods = m.architecture?.input_modalities || [];
    const modality = m.architecture?.modality || "";
    const idLower = m.id.toLowerCase();

    // Is free?
    const isFree =
      m.id.endsWith(":free") ||
      m.id.includes("free") ||
      ((m.pricing?.prompt === "0" || m.pricing?.prompt === 0) &&
        (m.pricing?.completion === "0" || m.pricing?.completion === 0));

    // Has vision?
    const supportsVision =
      inputMods.includes("image") ||
      modality.includes("image") ||
      idLower.includes("vl") ||
      idLower.includes("vision") ||
      idLower.includes("omni") ||
      idLower === "openrouter/free";

    const isRecommended = PRIMARY_FREE_VISION_MODELS.includes(m.id) || PRIMARY_FREE_TEXT_MODELS.includes(m.id);

    return {
      id: m.id,
      name: m.name || m.id,
      description: m.description,
      contextLength: m.context_length || 4096,
      supportsVision,
      isFree,
      isRecommended,
    };
  });

  cachedModels = parsedModels;
  cacheTimestamp = now;

  const freeVision = parsedModels.filter((m) => m.isFree && m.supportsVision);
  const freeText = parsedModels.filter((m) => m.isFree && !m.supportsVision);

  return {
    models: parsedModels,
    freeVisionModels: freeVision,
    freeTextModels: freeText,
    visionCount: parsedModels.filter((m) => m.supportsVision).length,
    freeCount: parsedModels.filter((m) => m.isFree).length,
  };
}

/**
 * Converts image path or URL to an inline base64 data URL
 */
export async function resolveImageToDataUrl(imagePathOrUrl: string): Promise<string> {
  const clean = imagePathOrUrl.trim();
  if (clean.startsWith("data:")) {
    return clean;
  }

  // Internal uploads path: e.g. /uploads/1726...
  const filename = clean.replace(/^\/uploads\//, "");
  const fileData = await getUploadedFile(filename);
  if (fileData) {
    return `data:${fileData.contentType};base64,${fileData.buffer.toString("base64")}`;
  }

  // External public URL fallback
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const resp = await fetch(clean);
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        const contentType = resp.headers.get("content-type") || "image/png";
        const b64 = Buffer.from(buffer).toString("base64");
        return `data:${contentType};base64,${b64}`;
      }
    } catch {
      return clean;
    }
  }

  return clean;
}

/**
 * Call OpenRouter with automatic 100% Free model fallbacks
 */
export async function callOpenRouterWithFallback(options: {
  model?: string;
  hasImages?: boolean;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
  }>;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ content: string; reasoning?: string; modelUsed: string }> {
  const apiKey = getOpenRouterApiKey();

  // Pick fallback chain based on whether images are present
  const baseChain = options.hasImages
    ? PRIMARY_FREE_VISION_MODELS
    : PRIMARY_FREE_TEXT_MODELS;

  const requestedModel = options.model || baseChain[0];
  const fullChain = Array.from(new Set([requestedModel, ...baseChain]));

  let lastError: Error | null = null;

  for (const model of fullChain) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mars-it-school.uz",
          "X-Title": "Mars IT School Platform",
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          max_tokens: options.maxTokens || 2500,
          temperature: options.temperature ?? 0.2,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`OpenRouter bepul model ${model} xatoligi (${res.status}): ${errText}`);
        lastError = new Error(`OpenRouter error (${res.status}): ${errText}`);
        continue;
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content || "";
      const reasoning = choice?.message?.reasoning || "";

      if (content || reasoning) {
        return {
          content: content || reasoning,
          reasoning,
          modelUsed: data.model || model,
        };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`OpenRouter model ${model} ulanish xatoligi:`, msg);
      lastError = e instanceof Error ? e : new Error(msg);
    }
  }

  throw lastError || new Error("OpenRouter bepul modellarning barchasi so'rovni bajara olmadi.");
}

/**
 * AI Code Review: Analyzes student code screenshot or text snippet using 100% free models
 */
export async function reviewStudentCode(params: {
  imageUrls?: string[];
  codeSnippet?: string;
  taskTitle?: string;
  groupName?: string;
  studentName?: string;
  model?: string;
}): Promise<AIReviewResult> {
  const resolvedImages: string[] = [];
  if (params.imageUrls && params.imageUrls.length > 0) {
    for (const url of params.imageUrls.slice(0, 3)) {
      if (url && url.trim()) {
        const dataUrl = await resolveImageToDataUrl(url);
        resolvedImages.push(dataUrl);
      }
    }
  }

  const promptText = `Sen Mars IT School dasturlash o'qituvchisining professional va mehribon AI assistentisan.
O'quvchi topshirgan dasturlash kodini chuqur tahlil qil:

Mavzu/Topshiriq nomi: "${params.taskTitle || "Kundalik dasturlash topshirig'i"}"
${params.studentName ? `O'quvchi ismi: ${params.studentName}` : ""}
${params.groupName ? `Guruh: ${params.groupName}` : ""}
${params.codeSnippet ? `\nTopshirilgan kod matni:\n\`\`\`\n${params.codeSnippet}\n\`\`\`\n` : ""}

Quyidagi talablarga amal qilgan holda, javobingni FAQAT toza JSON ko'rinishida ber:
{
  "language": "JavaScript | Python | HTML/CSS va h.k.",
  "status": "CORRECT" | "NEEDS_REVISION" | "RETRY" | "INCORRECT",
  "suggestedScore": 85,
  "summary": "Koddagi asosiy holat haqida 1-2 gap o'zbek tilida",
  "issues": [
    "Aniq topilgan xatolar ro'yxati (qator raqami va to'g'irlash usuli bilan)"
  ],
  "strengths": [
    "O'quvchining to'g'ri yozgan yutuqlari"
  ],
  "teacherFeedback": "O'qituvchi o'quvchiga yuborishi uchun samimiy, ruhlantiruvchi va aniq yo'l ko'rsatuvchi o'zbekcha sharh",
  "correctedCode": "Xatolar to'g'rilangan toza kod matni",
  "extractedCode": "Skrinshotdan o'qib olingan kod"
}`;

  const userContent: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: promptText },
  ];

  for (const imgUrl of resolvedImages) {
    userContent.push({
      type: "image_url",
      image_url: { url: imgUrl },
    });
  }

  const hasImages = resolvedImages.length > 0;
  const { content, reasoning, modelUsed } = await callOpenRouterWithFallback({
    model: params.model || (hasImages ? PRIMARY_FREE_VISION_MODELS[0] : PRIMARY_FREE_TEXT_MODELS[0]),
    hasImages,
    maxTokens: 2500,
    temperature: 0.1,
    messages: [{ role: "user", content: userContent }],
  });

  // Extract JSON from content or reasoning
  const rawText = content || reasoning || "";
  let jsonString = rawText.trim();

  // Try finding JSON object in output
  const jsonMatch = rawText.match(/\{[\s\S]*"teacherFeedback"[\s\S]*\}/) || rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonString = jsonMatch[0];
  } else if (jsonString.startsWith("```json")) {
    jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (jsonString.startsWith("```")) {
    jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      language: parsed.language || "JavaScript",
      status: ["CORRECT", "NEEDS_REVISION", "RETRY", "INCORRECT"].includes(parsed.status)
        ? parsed.status
        : "NEEDS_REVISION",
      suggestedScore: typeof parsed.suggestedScore === "number" ? parsed.suggestedScore : 85,
      summary: parsed.summary || "Kod muvaffaqiyatli tekshirildi.",
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Topshiriq strukturasi tuzilgan."],
      teacherFeedback: parsed.teacherFeedback || "Topshiriq ko'rib chiqildi.",
      correctedCode: parsed.correctedCode || "",
      extractedCode: parsed.extractedCode || "",
      modelUsed,
    };
  } catch {
    // If JSON parsing fails, extract human-readable text from raw output
    const cleanFeedback = rawText
      .replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[0-9]|\n1\.|$)/gi, "")
      .trim();

    return {
      language: "JavaScript / Dasturlash",
      status: "NEEDS_REVISION",
      suggestedScore: 80,
      summary: "AI kodni tahlil qildi va sharh tayyorladi.",
      issues: ["Koddagi logikani sharhdan ko'rib chiqing."],
      strengths: ["Topshiriq qabul qilindi."],
      teacherFeedback: cleanFeedback.slice(0, 700) || "Topshiriq ko'rib chiqildi.",
      correctedCode: "",
      modelUsed,
    };
  }
}

/**
 * AI OCR: Extracts clean code from screenshots using 100% free vision models
 */
export async function extractCodeFromImage(params: {
  imageUrls: string[];
  model?: string;
}): Promise<AIOCRResult> {
  const resolvedImages: string[] = [];
  for (const url of params.imageUrls.slice(0, 3)) {
    if (url && url.trim()) {
      const dataUrl = await resolveImageToDataUrl(url);
      resolvedImages.push(dataUrl);
    }
  }

  if (resolvedImages.length === 0) {
    throw new Error("Kodni ajratish uchun rasm topilmadi.");
  }

  const promptText = `Ushbu skrinshotdagi dasturlash kodini diqqat bilan o'qi va aniq toza kod matni ko'rinishida ajratib ber (OCR).
Hech qanday boshqa tushuntirish, izoh yoki kirish so'zlari yozma.
Faqat kod blokining o'zini qaytar:
\`\`\`dasturlash_tili
kod bu yerda
\`\`\``;

  const userContent: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: promptText },
  ];

  for (const imgUrl of resolvedImages) {
    userContent.push({
      type: "image_url",
      image_url: { url: imgUrl },
    });
  }

  const { content, reasoning, modelUsed } = await callOpenRouterWithFallback({
    model: params.model || PRIMARY_FREE_VISION_MODELS[0],
    hasImages: true,
    maxTokens: 2500,
    temperature: 0.1,
    messages: [{ role: "user", content: userContent }],
  });

  const fullText = content || reasoning || "";
  let language = "javascript";
  let code = fullText.trim();

  const match = fullText.match(/```([a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/);
  if (match) {
    if (match[1]) language = match[1].toLowerCase();
    code = match[2].trim();
  }

  return {
    language,
    code,
    modelUsed,
  };
}
