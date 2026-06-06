import React, { useState, useRef, useCallback } from "react";
import {
  Upload, Copy, Check, ChevronDown, ChevronUp, Sparkles,
  Palette, Sofa, Lightbulb, Layers, Frame, Wind, RotateCcw, AlertTriangle, ArrowRight
} from "lucide-react";

// ---------------------------------------------------------------------------
// Interior Design Judge — Interior Zone
// Luxury dark dashboard. Upload an interior image -> automatic AI judgment,
// scoring, recommendations, and a copy-ready Nano Banana Pro edit prompt.
// ---------------------------------------------------------------------------

const FONTS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Manrope:wght@300;400;500;600;700&family=El+Messiri:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700&display=swap');
`;

const T = {
  en: {
    dir: "ltr",
    brand: "INTERIOR ZONE",
    title: "Interior Design Judge",
    tagline: "Upload a space. Get a professional critique, a score, and a ready-to-use AI edit prompt.",
    dropTitle: "Drop your interior image here",
    dropSub: "or click to browse — JPG, PNG, WEBP",
    analyzing: "Reading the space",
    analyzingMsgs: ["Reading the space…", "Scoring 11 design principles…", "Checking proportion, light & material…", "Writing your edit prompt…"],
    overall: "Overall Score",
    summaryTitle: "Verdict",
    expand: "View full breakdown",
    collapse: "Hide breakdown",
    corePrinciples: "Core Principles",
    keyElements: "Key Elements",
    eleganceTest: "The Elegance Test",
    recsTitle: "Recommended Edits",
    promptTitle: "Nano Banana Pro — Edit Prompt",
    promptSub: "Paste this directly into Nano Banana Pro to edit the image.",
    copy: "Copy prompt",
    copied: "Copied!",
    why: "Why this works",
    risks: "Risks & flags",
    next: "Next steps",
    again: "Judge another image",
    error: "Something went wrong while analyzing. Please try again.",
    cats: { color: "Color", furniture: "Furniture", lighting: "Lighting", texture: "Texture & Material", styling: "Styling & Accessories", mood: "Mood & Atmosphere" },
    impact: { High: "High Impact", Medium: "Medium Impact", "Nice-to-Have": "Nice-to-Have" },
    of: "/ 115",
  },
  ar: {
    dir: "rtl",
    brand: "إنتيريور زون",
    title: "حَكَم التصميم الداخلي",
    tagline: "ارفع صورة المساحة. استلم تقييم احترافي، ودرجة، وبرومبت تعديل جاهز للاستخدام.",
    dropTitle: "اسحب صورة المساحة هنا",
    dropSub: "أو اضغط للاختيار — JPG, PNG, WEBP",
    analyzing: "بقرأ المساحة",
    analyzingMsgs: ["بقرأ المساحة…", "بقيّم 11 مبدأ تصميمي…", "بفحص النِّسَب والإضاءة والخامة…", "بكتب برومبت التعديل…"],
    overall: "الدرجة الإجمالية",
    summaryTitle: "الحُكم",
    expand: "اعرض التفاصيل الكاملة",
    collapse: "إخفاء التفاصيل",
    corePrinciples: "المبادئ الأساسية",
    keyElements: "العناصر الرئيسية",
    eleganceTest: "اختبار الأناقة",
    recsTitle: "التعديلات المقترحة",
    promptTitle: "Nano Banana Pro — برومبت التعديل",
    promptSub: "الصق ده مباشرة في Nano Banana Pro عشان تعدّل الصورة.",
    copy: "انسخ البرومبت",
    copied: "تم النسخ!",
    why: "ليه ده بيشتغل",
    risks: "مخاطر وتنبيهات",
    next: "الخطوات التالية",
    again: "قيّم صورة تانية",
    error: "حصل خطأ أثناء التحليل. حاول تاني.",
    cats: { color: "الألوان", furniture: "الأثاث", lighting: "الإضاءة", texture: "الخامة والملمس", styling: "التنسيق والإكسسوار", mood: "المزاج والجو العام" },
    impact: { High: "تأثير عالي", Medium: "تأثير متوسط", "Nice-to-Have": "إضافة جيدة" },
    of: "/ 115",
  },
};

const TIER_COLORS = {
  Masterclass: "#d4af6a",
  Professional: "#c9a86a",
  Competent: "#b08d57",
  Developing: "#9c7b4a",
  "Needs Rework": "#8a6d4a",
};

const CAT_ICONS = {
  color: Palette, furniture: Sofa, lighting: Lightbulb,
  texture: Layers, styling: Frame, mood: Wind,
};

function buildSystemPrompt(lang) {
  const language = lang === "ar"
    ? "Write ALL prose text (notes, summary, recommendation text, why/risks/next, elegance answers) in Egyptian-dialect Arabic. Keep technical design terms in English where natural."
    : "Write ALL prose text in clear, professional English.";

  return `You are an elite interior design critic with 30 years of experience judging spaces at the intersection of functionality and elegance. You judge an interior image, then recommend NON-STRUCTURAL edits, then produce a Nano Banana Pro edit prompt.

SCORING RUBRIC — score each item /10, referencing SPECIFIC visible elements (no generic praise):
CORE PRINCIPLES: 1) Proportion & Scale 2) Balance 3) Rhythm & Repetition 4) Hierarchy 5) Contrast with Restraint
KEY ELEMENTS: 6) Negative Space 7) Layered Lighting 8) Material Quality & Honesty 9) Texture Variation 10) Color Discipline 11) Curated Details
ELEGANCE TEST (3 yes/no with explanation): Can anything be removed without loss? Does every piece serve a purpose? Do transitions feel intentional?

OVERALL SCORE FORMULA (out of 115):
overall = ((sumCore*2) + (sumElements*1.5)) / 19 * 10 + eleganceBonus
where eleganceBonus = 5 if all three elegance answers favor elegance, 2 if two do, 0 otherwise.
Round to nearest integer.
TIERS: 95-115 Masterclass | 80-94 Professional | 60-79 Competent | 40-59 Developing | below 40 Needs Rework.
Be honest — do not inflate. A well-furnished room with no design thinking can score ~45.

RECOMMENDATIONS: non-structural ONLY (no wall/window/door/ceiling/floor-plan changes). Categories: color, furniture, lighting, texture, styling, mood. Each rec links to the principle it fixes. Tag impact: "High" | "Medium" | "Nice-to-Have". 8-12 recs total across categories.

NANO BANANA PRO PROMPT: ONE comprehensive labeled edit prompt implementing all High + Medium recs. Use EXACTLY this labeled format inside the "prompt" field, with literal newlines:
TASK:           Edit
CONTEXT:        ...
SUBJECT:        ...
SCENE:          ...
COMPOSITION:    Keep original camera angle and framing
CAMERA:         Match the original photo's perspective
LIGHTING:       ...
STYLE:          Interior photography, editorial quality, natural and inviting
KEEP:           Room structure, walls, windows, doors, ceiling, floor plan, camera angle, room dimensions
CONSTRAINTS:    No structural changes | No window/door additions | Maintain room proportions | No text or watermark
OUTPUT FORMAT:  Match original image aspect ratio
The prompt is ALWAYS in English.

${language}

Respond with ONLY a valid JSON object (no markdown, no backticks, no preamble) in EXACTLY this shape:
{
 "core":[{"name":"Proportion & Scale","score":0,"note":""},{"name":"Balance","score":0,"note":""},{"name":"Rhythm & Repetition","score":0,"note":""},{"name":"Hierarchy","score":0,"note":""},{"name":"Contrast with Restraint","score":0,"note":""}],
 "elements":[{"name":"Negative Space","score":0,"note":""},{"name":"Layered Lighting","score":0,"note":""},{"name":"Material Quality & Honesty","score":0,"note":""},{"name":"Texture Variation","score":0,"note":""},{"name":"Color Discipline","score":0,"note":""},{"name":"Curated Details","score":0,"note":""}],
 "elegance":[{"q":"Can you remove anything without losing the design?","a":"Yes/No","note":""},{"q":"Does every piece serve a purpose?","a":"Yes/No","note":""},{"q":"Do transitions feel intentional?","a":"Yes/No","note":""}],
 "overall":0,
 "tier":"Professional",
 "summary":"2-3 sentence verdict naming strongest and weakest points",
 "recommendations":{"color":[{"text":"","impact":"High"}],"furniture":[],"lighting":[],"texture":[],"styling":[],"mood":[]},
 "prompt":"TASK:           Edit\\nCONTEXT: ...",
 "why":["bilingual or selected-language bullet","..."],
 "risks":["..."],
 "next":["..."]
}
Keep notes concise (1-2 sentences). The "tier" value MUST be one of: Masterclass, Professional, Competent, Developing, Needs Rework (English label).`;
}

export default function InteriorDesignJudge() {
  const [lang, setLang] = useState("en");
  const [imageData, setImageData] = useState(null); // {b64, mediaType, url}
  const [loading, setLoading] = useState(false);
  const [loadIdx, setLoadIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const t = T[lang];

  const cycleLoader = useCallback((msgsLen) => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % msgsLen;
      setLoadIdx(i);
    }, 1800);
    return id;
  }, []);

  async function analyze(b64, mediaType, useLang) {
    setLoading(true);
    setError(null);
    setResult(null);
    setExpanded(false);
    setLoadIdx(0);
    const loaderId = cycleLoader(T[useLang].analyzingMsgs.length);
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
                { type: "text", text: buildSystemPrompt(useLang) + "\n\nNow judge the interior image above. Return ONLY the JSON object." },
              ],
            },
          ],
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(`Server returned a non-JSON response (HTTP ${res.status}).`);
      }

      if (!res.ok || data?.type === "error") {
        const msg = data?.error?.message || data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      if (!Array.isArray(data?.content)) {
        throw new Error("Unexpected response shape (no content).");
      }

      const text = data.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n");

      if (!text.trim()) throw new Error("Empty response from the model.");

      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) {
        throw new Error("Could not find JSON in the response.");
      }
      let parsed;
      try {
        parsed = JSON.parse(text.slice(start, end + 1));
      } catch (_) {
        if (data.stop_reason === "max_tokens") {
          throw new Error("The analysis was cut off (response too long). Try again.");
        }
        throw new Error("Could not read the analysis (invalid JSON).");
      }
      if (typeof parsed.overall !== "number") {
        throw new Error("The analysis came back incomplete. Try again.");
      }
      setResult(parsed);
    } catch (e) {
      console.error("Interior Judge error:", e);
      setError(`${T[useLang].error} (${e.message || e})`);
    } finally {
      clearInterval(loaderId);
      setLoading(false);
    }
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const originalUrl = reader.result;
      // Downscale to a max edge so big phone photos don't break the request.
      const img = new Image();
      img.onload = () => {
        const MAX = 1400;
        let { width, height } = img;
        const scale = Math.min(1, MAX / Math.max(width, height));
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const jpegUrl = canvas.toDataURL("image/jpeg", 0.85);
        const b64 = jpegUrl.split(",")[1];
        const info = { b64, mediaType: "image/jpeg", url: originalUrl };
        setImageData(info);
        analyze(b64, "image/jpeg", lang);
      };
      img.onerror = () => {
        // Fallback: send as-is if the image can't be drawn to canvas.
        const b64 = originalUrl.split(",")[1];
        const info = { b64, mediaType: file.type, url: originalUrl };
        setImageData(info);
        analyze(b64, file.type, lang);
      };
      img.src = originalUrl;
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  }

  function switchLang(next) {
    setLang(next);
    // Re-analyze in the new language if we already have an image + result.
    if (imageData && result && !loading) {
      analyze(imageData.b64, imageData.mediaType, next);
    }
  }

  function reset() {
    setImageData(null);
    setResult(null);
    setError(null);
    setExpanded(false);
  }

  function copyPrompt() {
    if (!result?.prompt) return;
    navigator.clipboard.writeText(result.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const tierColor = result ? (TIER_COLORS[result.tier] || "#c9a86a") : "#c9a86a";

  // circular ring math
  const R = 78, C = 2 * Math.PI * R;
  const pct = result ? Math.max(0, Math.min(1, result.overall / 115)) : 0;
  const dash = C * pct;

  const styles = {
    wrap: {
      fontFamily: lang === "ar" ? "'Tajawal', sans-serif" : "'Manrope', sans-serif",
      direction: t.dir,
      background: "radial-gradient(1200px 600px at 50% -10%, #221c15 0%, #14110d 45%, #0c0a07 100%)",
      color: "#efe6d6",
      minHeight: "100%",
      padding: "0",
    },
    display: lang === "ar" ? "'El Messiri', serif" : "'Cormorant Garamond', serif",
  };

  return (
    <div style={styles.wrap}>
      <style>{FONTS_CSS}</style>
      <style>{`
        * { box-sizing: border-box; }
        .izj-card {
          background: linear-gradient(180deg, rgba(38,31,23,0.9), rgba(26,21,15,0.9));
          border: 1px solid rgba(201,168,106,0.16);
          border-radius: 18px;
          box-shadow: 0 20px 50px -30px rgba(0,0,0,0.8);
        }
        .izj-fade { animation: izjFade 0.6s ease both; }
        @keyframes izjFade { from { opacity: 0; transform: translateY(14px);} to {opacity:1; transform:none;} }
        @keyframes izjSpin { to { transform: rotate(360deg);} }
        @keyframes izjPulse { 0%,100%{opacity:0.35;} 50%{opacity:1;} }
        .izj-btn { transition: all .2s ease; cursor: pointer; }
        .izj-btn:hover { transform: translateY(-1px); }
        .izj-bar-fill { transition: width 1s cubic-bezier(.2,.7,.2,1); }
        .izj-drop:hover { border-color: rgba(201,168,106,0.6) !important; background: rgba(201,168,106,0.05) !important; }
        .izj-grain::before {
          content:""; position:absolute; inset:0; pointer-events:none; opacity:0.04; border-radius:inherit;
          background-image: radial-gradient(rgba(255,255,255,0.6) 0.5px, transparent 0.5px);
          background-size: 4px 4px;
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "34px 20px 70px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ letterSpacing: lang === "ar" ? 0 : "0.32em", fontSize: 11, color: "#c9a86a", fontWeight: 600, marginBottom: 6 }}>
              {t.brand}
            </div>
            <h1 style={{ fontFamily: styles.display, fontWeight: 600, fontSize: 40, lineHeight: 1.05, margin: 0, color: "#f5ecdb" }}>
              {t.title}
            </h1>
            <p style={{ margin: "10px 0 0", maxWidth: 520, color: "#b6a98f", fontSize: 14.5, lineHeight: 1.6 }}>
              {t.tagline}
            </p>
          </div>
          {/* Lang toggle */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(201,168,106,0.22)", borderRadius: 999, padding: 4, gap: 2 }}>
            {["en", "ar"].map((l) => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className="izj-btn"
                style={{
                  border: "none", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600,
                  fontFamily: l === "ar" ? "'Tajawal',sans-serif" : "'Manrope',sans-serif",
                  background: lang === l ? "linear-gradient(180deg,#c9a86a,#a9854f)" : "transparent",
                  color: lang === l ? "#1a130a" : "#c9a86a",
                }}
              >
                {l === "en" ? "EN" : "عربي"}
              </button>
            ))}
          </div>
        </div>

        {/* Upload zone */}
        {!result && !loading && (
          <div className="izj-fade" style={{ marginTop: 30 }}>
            <div
              className="izj-drop"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{
                cursor: "pointer", textAlign: "center", padding: "56px 24px",
                border: `1.5px dashed ${dragOver ? "rgba(201,168,106,0.7)" : "rgba(201,168,106,0.3)"}`,
                borderRadius: 20, background: dragOver ? "rgba(201,168,106,0.06)" : "rgba(255,255,255,0.015)",
                transition: "all .2s ease",
              }}
            >
              <div style={{
                width: 64, height: 64, margin: "0 auto 18px", borderRadius: "50%",
                display: "grid", placeItems: "center",
                background: "linear-gradient(180deg, rgba(201,168,106,0.18), rgba(201,168,106,0.05))",
                border: "1px solid rgba(201,168,106,0.3)",
              }}>
                <Upload size={26} color="#d4af6a" />
              </div>
              <div style={{ fontFamily: styles.display, fontSize: 24, color: "#f0e6d4", fontWeight: 600 }}>{t.dropTitle}</div>
              <div style={{ color: "#9c8f76", fontSize: 13.5, marginTop: 8 }}>{t.dropSub}</div>
            </div>
            <input
              ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {error && (
              <div style={{ marginTop: 16, color: "#e0a87a", fontSize: 13.5, textAlign: "center" }}>{error}</div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="izj-fade" style={{ marginTop: 40, textAlign: "center" }}>
            {imageData && (
              <img src={imageData.url} alt="" style={{ maxWidth: 280, width: "100%", borderRadius: 16, marginBottom: 26, opacity: 0.6, border: "1px solid rgba(201,168,106,0.2)" }} />
            )}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(201,168,106,0.18)", borderTopColor: "#d4af6a", animation: "izjSpin 0.9s linear infinite" }} />
            </div>
            <div style={{ fontFamily: styles.display, fontSize: 22, color: "#e9dcc4", animation: "izjPulse 1.6s ease infinite" }}>
              {t.analyzingMsgs[loadIdx]}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="izj-fade" style={{ marginTop: 28 }}>
            {/* Score hero */}
            <div className="izj-card izj-grain" style={{ position: "relative", overflow: "hidden", padding: 26, display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
                {imageData && (
                  <img src={imageData.url} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 14, border: "1px solid rgba(201,168,106,0.25)" }} />
                )}
                <div style={{ position: "relative", width: 180, height: 180 }}>
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(201,168,106,0.14)" strokeWidth="10" />
                    <circle
                      cx="90" cy="90" r={R} fill="none" stroke={tierColor} strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${dash} ${C}`} transform="rotate(-90 90 90)"
                      style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.2,.7,.2,1)" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                    <div>
                      <div style={{ fontFamily: styles.display, fontSize: 46, fontWeight: 700, color: "#f5ecdb", lineHeight: 1 }}>{result.overall}</div>
                      <div style={{ fontSize: 12, color: "#9c8f76", marginTop: 2 }}>{t.of}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 11, letterSpacing: lang === "ar" ? 0 : "0.2em", color: "#9c8f76", textTransform: "uppercase", marginBottom: 6 }}>{t.overall}</div>
                <div style={{ display: "inline-block", fontFamily: styles.display, fontSize: 26, fontWeight: 600, color: tierColor, padding: "2px 0", borderBottom: `2px solid ${tierColor}55`, marginBottom: 12 }}>
                  {result.tier}
                </div>
                <p style={{ margin: 0, color: "#c6b99f", fontSize: 14.5, lineHeight: 1.7 }}>{result.summary}</p>
              </div>
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="izj-btn"
              style={{
                marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "rgba(201,168,106,0.08)", border: "1px solid rgba(201,168,106,0.22)", color: "#d4af6a",
                borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600,
                fontFamily: lang === "ar" ? "'Tajawal',sans-serif" : "'Manrope',sans-serif",
              }}
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              {expanded ? t.collapse : t.expand}
            </button>

            {/* Detailed breakdown */}
            {expanded && (
              <div className="izj-fade" style={{ marginTop: 16, display: "grid", gap: 16 }}>
                <ScoreGroup title={t.corePrinciples} items={result.core} display={styles.display} lang={lang} />
                <ScoreGroup title={t.keyElements} items={result.elements} display={styles.display} lang={lang} />
                {/* Elegance test */}
                <div className="izj-card" style={{ padding: 22 }}>
                  <h3 style={{ fontFamily: styles.display, fontSize: 20, margin: "0 0 14px", color: "#f0e6d4" }}>{t.eleganceTest}</h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    {result.elegance?.map((e, i) => {
                      const fav = /^y/i.test(e.a) ? null : null;
                      return (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{
                            flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, marginTop: 2,
                            background: "rgba(201,168,106,0.14)", color: "#d4af6a", border: "1px solid rgba(201,168,106,0.3)",
                          }}>{e.a}</div>
                          <div>
                            <div style={{ fontSize: 13.5, color: "#e2d7c0", fontWeight: 600 }}>{e.q}</div>
                            <div style={{ fontSize: 13, color: "#a89b81", marginTop: 3, lineHeight: 1.6 }}>{e.note}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <h2 style={{ fontFamily: styles.display, fontSize: 26, margin: "34px 0 16px", color: "#f5ecdb" }}>{t.recsTitle}</h2>
            <div style={{ display: "grid", gap: 14 }}>
              {Object.entries(result.recommendations || {}).map(([cat, items]) => {
                if (!items || items.length === 0) return null;
                const Icon = CAT_ICONS[cat] || Sparkles;
                return (
                  <div key={cat} className="izj-card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: "rgba(201,168,106,0.12)", border: "1px solid rgba(201,168,106,0.25)" }}>
                        <Icon size={17} color="#d4af6a" />
                      </div>
                      <span style={{ fontFamily: styles.display, fontSize: 19, color: "#f0e6d4", fontWeight: 600 }}>{t.cats[cat]}</span>
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {items.map((rec, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <ImpactBadge impact={rec.impact} label={t.impact[rec.impact] || rec.impact} lang={lang} />
                          <span style={{ fontSize: 14, color: "#cdc1a8", lineHeight: 1.65 }}>{rec.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nano Banana Pro prompt */}
            <div className="izj-card" style={{ padding: 22, marginTop: 30, border: "1px solid rgba(201,168,106,0.32)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Sparkles size={18} color="#d4af6a" />
                    <h2 style={{ fontFamily: styles.display, fontSize: 22, margin: 0, color: "#f5ecdb" }}>{t.promptTitle}</h2>
                  </div>
                  <p style={{ margin: "6px 0 0", color: "#a89b81", fontSize: 13 }}>{t.promptSub}</p>
                </div>
                <button
                  onClick={copyPrompt}
                  className="izj-btn"
                  style={{
                    display: "flex", alignItems: "center", gap: 7, border: "none", borderRadius: 10, padding: "10px 18px",
                    fontSize: 13.5, fontWeight: 700, color: copied ? "#1a130a" : "#1a130a",
                    background: copied ? "linear-gradient(180deg,#8fbf7a,#5f9a4c)" : "linear-gradient(180deg,#d4af6a,#a9854f)",
                    fontFamily: lang === "ar" ? "'Tajawal',sans-serif" : "'Manrope',sans-serif",
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
              <pre dir="ltr" style={{
                marginTop: 16, marginBottom: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                background: "#0c0a07", border: "1px solid rgba(201,168,106,0.18)", borderRadius: 12,
                padding: 18, color: "#d8cdb4", fontSize: 12.5, lineHeight: 1.65,
                fontFamily: "'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace", textAlign: "left",
              }}>{result.prompt}</pre>
            </div>

            {/* Why / Risks / Next */}
            <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
              {result.why?.length > 0 && (
                <InfoBlock title={t.why} icon={<Check size={16} color="#9fc98a" />} items={result.why} accent="#9fc98a" display={styles.display} />
              )}
              {result.risks?.length > 0 && (
                <InfoBlock title={t.risks} icon={<AlertTriangle size={16} color="#e0b97a" />} items={result.risks} accent="#e0b97a" display={styles.display} />
              )}
              {result.next?.length > 0 && (
                <InfoBlock title={t.next} icon={<ArrowRight size={16} color="#c9a86a" />} items={result.next} accent="#c9a86a" display={styles.display} />
              )}
            </div>

            {/* Reset */}
            <button
              onClick={reset}
              className="izj-btn"
              style={{
                margin: "28px auto 0", display: "flex", alignItems: "center", gap: 8,
                background: "transparent", border: "1px solid rgba(201,168,106,0.3)", color: "#c9a86a",
                borderRadius: 999, padding: "11px 22px", fontSize: 14, fontWeight: 600,
                fontFamily: lang === "ar" ? "'Tajawal',sans-serif" : "'Manrope',sans-serif",
              }}
            >
              <RotateCcw size={16} /> {t.again}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreGroup({ title, items, display, lang }) {
  return (
    <div className="izj-card" style={{ padding: 22 }}>
      <h3 style={{ fontFamily: display, fontSize: 20, margin: "0 0 16px", color: "#f0e6d4" }}>{title}</h3>
      <div style={{ display: "grid", gap: 16 }}>
        {items?.map((it, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: "#e2d7c0", fontWeight: 600 }}>{it.name}</span>
              <span style={{ fontFamily: display, fontSize: 17, fontWeight: 700, color: scoreColor(it.score) }}>{it.score}<span style={{ fontSize: 12, color: "#7d7259" }}>/10</span></span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
              <div className="izj-bar-fill" style={{ height: "100%", width: `${(it.score / 10) * 100}%`, background: `linear-gradient(90deg, ${scoreColor(it.score)}aa, ${scoreColor(it.score)})`, borderRadius: 99 }} />
            </div>
            {it.note && <div style={{ fontSize: 12.5, color: "#a89b81", marginTop: 6, lineHeight: 1.6 }}>{it.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactBadge({ impact, label, lang }) {
  const map = {
    High: { bg: "rgba(212,175,106,0.18)", bd: "rgba(212,175,106,0.45)", fg: "#e3c386" },
    Medium: { bg: "rgba(176,141,87,0.16)", bd: "rgba(176,141,87,0.4)", fg: "#c9a86a" },
    "Nice-to-Have": { bg: "rgba(255,255,255,0.05)", bd: "rgba(255,255,255,0.14)", fg: "#9c8f76" },
  };
  const c = map[impact] || map.Medium;
  return (
    <span style={{
      flexShrink: 0, fontSize: 10.5, fontWeight: 700, padding: "4px 9px", borderRadius: 6, whiteSpace: "nowrap",
      background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, marginTop: 1,
      fontFamily: lang === "ar" ? "'Tajawal',sans-serif" : "'Manrope',sans-serif",
    }}>{label}</span>
  );
}

function InfoBlock({ title, icon, items, accent, display }) {
  return (
    <div className="izj-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        {icon}
        <h3 style={{ fontFamily: display, fontSize: 18, margin: 0, color: "#f0e6d4" }}>{title}</h3>
      </div>
      <ul style={{ margin: 0, paddingInlineStart: 18, display: "grid", gap: 8 }}>
        {items.map((x, i) => (
          <li key={i} style={{ fontSize: 13.5, color: "#c6b99f", lineHeight: 1.65, "::marker": { color: accent } }}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function scoreColor(s) {
  if (s >= 8) return "#d4af6a";
  if (s >= 6) return "#c9a86a";
  if (s >= 4) return "#bd8f5a";
  return "#a8704a";
}
