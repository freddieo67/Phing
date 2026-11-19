import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AiVerificationResult {
  score: number;        // 0 - 100
  approved: boolean;     // true if score >= 75
  reason: string;       // Kort förklaring
  detected?: string;    // Vad AI såg
}

export async function verifyPhotoWithGemini(
  photoBase64OrDataUrl: string,
  targetLabel: string,
  hint?: string | null
): Promise<AiVerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AI] GEMINI_API_KEY saknas – godkänner automatiskt i dev/offline-läge');
    return {
      score: 100,
      approved: true,
      reason: 'AI-nyckel saknas på servern – godkändes i utvecklingsläge.',
      detected: targetLabel,
    };
  }

  // Extrahera ren base64 och mimeType om data-URL
  let base64 = photoBase64OrDataUrl;
  let mimeType = 'image/jpeg';
  if (photoBase64OrDataUrl.startsWith('data:')) {
    const match = photoBase64OrDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match && match[1] && match[2]) {
      mimeType = match[1];
      base64 = match[2];
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-1.5-flash är blixtsnabb och har hög gratiskvot för bildanalys
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Du är en opartisk och noggrann domare i ett fotobingo-tävlingsspel (Phing).
Spelaren har tagit ett foto och påstår att det föreställer målet: "${targetLabel}".
${hint ? `Tilläggsinformation om målet: "${hint}"` : ''}

UPPGIFT:
Analysera fotot och bedöm hur säker du är på att fotot faktiskt visar målet "${targetLabel}".
För att bli godkänd i spelet krävs minst 75% säkerhet (score).

BEDÖMNINGSREGLER:
- Ge 75–100% om motivet med hög sannolikhet är det som efterfrågas (t.ex. rätt bilmodell, rätt fågelart, en riktig brandpost, etc.).
- Ge 0–74% om motivet är felaktigt, för otydligt/suddigt för att identifiera, taget på en datorskärm/mobilskärm (fusk), eller saknar objektet.
- Var rättvis men kräver att objektet faktiskt syns i bild.

SVARSFORMAT:
Svara ENDAST med giltig JSON i detta format, inget annat:
{
  "score": 85,
  "reason": "Tydlig bild på en brandpost på trottoaren.",
  "detected": "Brandpost"
}`;

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Kunde inte parsa JSON från AI: ${text.slice(0, 100)}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    const reason = typeof parsed.reason === 'string' ? parsed.reason : '';
    const detected = typeof parsed.detected === 'string' ? parsed.detected : targetLabel;

    return {
      score,
      approved: score >= 75,
      reason,
      detected,
    };
  } catch (err: any) {
    console.error('[AI] Fel vid Gemini-analys:', err?.message || err);
    throw new Error(`AI-analys misslyckades: ${err?.message || 'Kunde inte nå AI-tjänsten'}`);
  }
}
