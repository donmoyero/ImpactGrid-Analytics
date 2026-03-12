import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app  = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

/* ── Health check ── */
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ImpactGrid Dijo", ts: new Date().toISOString() });
});

/* ── Keep-warm ping ── */
app.get("/ping", (req, res) => res.json({ pong: true }));

/* ── Chat endpoint ── */
app.post("/chat", async (req, res) => {
  try {
    const { message, mode = "adviser" } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const systemPrompts = {
      adviser: `You are Dijo, a straight-talking financial adviser built into ImpactGrid.
You talk like a smart friend who happens to know a lot about business finance — not like a textbook.
Keep it conversational, warm, and direct. No waffle, no corporate speak.
When someone shares their numbers, give them real, specific feedback — not generic advice.
If something looks bad, say so clearly but kindly. If something looks good, tell them.
Use plain English. Short sentences. Be the adviser they wish they had.
Never say things like "Certainly!" or "Great question!" — just get straight to the point.`,

      dashboard: `You are Dijo, the helpful assistant inside ImpactGrid's dashboard.
You help users understand how to use the platform — adding data, reading their charts, understanding their scores.
Talk like a helpful colleague, not a customer service script.
Be brief and practical. If you don't know something specific about their account, say so honestly.
Never say things like "Certainly!" or "Great question!" — just answer naturally.`,

      group: `You are Dijo, the assistant on the ImpactGrid Group website.
You help visitors understand what ImpactGrid does, the pricing, and how to get started.
Be friendly and genuine — like a real person who works there, not a sales bot.
Keep answers short and useful. If someone's ready to sign up, encourage them warmly.
Never say things like "Certainly!" or "Great question!" — just have a real conversation.`
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.adviser;

    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      max_tokens:  1024,
      temperature: 0.75,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message }
      ]
    });

    const reply = completion.choices[0]?.message?.content || "I couldn't generate a response.";
    res.json({ reply });

  } catch (err) {
    console.error("[Dijo] Error:", err.message);
    res.status(500).json({ error: "AI service error", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ImpactGrid Dijo running on port ${PORT}`);
});
