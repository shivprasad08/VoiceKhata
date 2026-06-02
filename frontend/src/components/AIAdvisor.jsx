// src/components/AIAdvisor.jsx
// VoiceKhata AI Business Advisor — insights panel + chat interface

import { useState, useEffect, useRef } from "react";

const DEMO_USER_ID = "demo-rajesh-001";

// ── mock insights for standalone demo ────────────────────────────────────────
const MOCK_INSIGHTS = {
  headline: "इस हफ्ते ₹2,821 का मुनाफा — लेकिन margin सिर्फ 5.3% है, यह खतरे की घंटी है।",
  scorecard: {
    sales_vs_last_week: "+12.1% — ₹52,814 vs ₹47,120 पिछले हफ्ते",
    expense_control: "Salary ₹15,810 — revenue का 31.6% — बहुत ज्यादा",
    profit_margin: "5.3% — kirana store के लिए dangerously कम",
    gst_position: "₹2,802 input credit available — इसी महीने claim करें",
    udhar_risk: "₹6,400 overdue — 3 customers से collect करना है"
  },
  insights: [
    {
      category: "Profit Warning",
      title: "Margin 5.3% — अभी action लेना ज़रूरी है",
      what_happened: "इस हफ्ते total expenses ₹49,993 थे जबकि sales ₹52,814। इसमें से अकेले staff salary ₹15,810 है — यानी हर ₹100 की sale में ₹31.60 सिर्फ salary में जा रहा है। Normal kirana margin 15-20% होता है।",
      why_it_matters: "अगर अगले हफ्ते sales थोड़ी भी कम हुई, तो आप loss में जा सकते हैं। यह sustainable नहीं है।",
      do_this_now: "Helper की working hours review करें। अगर afternoon 2-5 PM slow time है, तो उस shift में helper की जरूरत नहीं। इससे ₹3,000-4,000 monthly बच सकते हैं।",
      urgency: "urgent"
    },
    {
      category: "Sales Pattern",
      title: "31 May को ₹13,762 की sale — इसका कारण समझें",
      what_happened: "31 May आपका best day था — ₹13,762 की sale, जो average daily sales ₹7,545 से 82% ज्यादा है। यह महीने का आखिरी दिन था जब लोग salary मिलने के बाद खरीदारी करते हैं।",
      why_it_matters: "अगर आप इस pattern को पहचान लें, तो month-end पर extra stock रख सकते हैं और sales miss नहीं करेंगे।",
      do_this_now: "हर महीने की 28-31 तारीख को Beverages और Snacks का stock 30% extra रखें। Manoj Traders को 27 तारीख को order दें ताकि delivery time पर हो।",
      urgency: "important"
    },
    {
      category: "Expense Alert",
      title: "Rent ₹8,000 + Salary ₹15,810 = Revenue का 45%",
      what_happened: "Fixed costs (rent ₹8,000 + salary ₹15,810) मिलाकर ₹23,810 हैं। यह इस हफ्ते की total sales का 45% है। बाकी stock purchase और operations उसके ऊपर हैं।",
      why_it_matters: "Fixed costs इतने high होने पर, slow week में घाटा तय है। आपको minimum ₹45,000 weekly sales चाहिए सिर्फ breakeven के लिए।",
      do_this_now: "Breakeven calculation: (₹23,810 fixed + avg stock cost) ÷ gross margin। यह number निकालें और इसे अपना weekly sales target बनाएं।",
      urgency: "important"
    },
    {
      category: "GST",
      title: "₹2,802 का GST input credit — claim नहीं किया तो expire",
      what_happened: "इस period में purchases पर ₹2,802 GST pay किया। यह आपका input tax credit है जो government को दिए GST से minus हो सकता है। Net GST liability सिर्फ ₹18 है।",
      why_it_matters: "यह credit महीने के end में GSTR-3B file करते वक्त claim होता है। Claim नहीं किया तो यह पैसा डूब जाता है।",
      do_this_now: "इस महीने की GSTR-3B में purchases ₹49,993 और ITC ₹2,802 enter करें। Net payment ₹18 ही आएगा। CA को यह data अभी भेज दें।",
      urgency: "urgent"
    },
    {
      category: "Udhar",
      title: "₹6,400 overdue — cash flow tight करने की वजह यही है",
      what_happened: "Ramesh Gupta (₹2,500, 12 दिन overdue), Anil Shinde (₹2,200, 8 दिन overdue), Ravi Bhor (₹1,700, 5 दिन overdue) — तीनों ने अभी तक payment नहीं दी। यह ₹6,400 आपके current profit ₹2,821 से दोगुना है।",
      why_it_matters: "यह पैसा आपकी pocket में है लेकिन किसी और के हाथ में है। इसे collect करना profit बढ़ाने से ज्यादा आसान है।",
      do_this_now: "आज Ramesh Gupta को call करें — 12 दिन बहुत ज्यादा है। Partial ₹1,500 भी accept करें। Anil को WhatsApp message भेजें। इस हफ्ते minimum ₹4,000 collect करने का target रखें।",
      urgency: "urgent"
    }
  ],
  udhar_action: "Ramesh Gupta (₹2,500, 12 दिन overdue) — आज call करें। Anil Shinde (₹2,200) को WhatsApp भेजें। इस हफ्ते ₹4,000 collect करें।",
  gst_action: "इस महीने GSTR-3B में ITC ₹2,802 claim करें। Net tax payment सिर्फ ₹18। CA को data आज share करें।",
  next_week_goal: "Target: ₹58,000 sales next week (+10% from this week). Reason: month-end bonus effect खत्म हुआ लेकिन आप Snacks और Beverages में extra stock लेकर compensate कर सकते हैं।"
};

const MOCK_INSIGHTS_EN = {
  headline: "₹2,821 profit this week — but margin is only 5.3%, this is a red flag.",
  scorecard: {
    sales_vs_last_week: "+12.1% — ₹52,814 vs ₹47,120 last week",
    expense_control: "Salary ₹15,810 — 31.6% of revenue — too high",
    profit_margin: "5.3% — dangerously low for a kirana store",
    gst_position: "₹2,802 input credit available — claim this month",
    udhar_risk: "₹6,400 overdue — collect from 3 customers"
  },
  insights: [
    {
      category: "Profit Warning",
      title: "Margin 5.3% — action needed now",
      what_happened: "Total expenses this week were ₹49,993 while sales were ₹52,814. Staff salary alone is ₹15,810 — meaning for every ₹100 in sales, ₹31.60 goes to salary. Normal kirana margin is 15-20%.",
      why_it_matters: "If sales drop even slightly next week, you might face a loss. This is not sustainable.",
      do_this_now: "Review helper's working hours. If 2-5 PM is slow, you don't need a helper for that shift. This can save ₹3,000-4,000 monthly.",
      urgency: "urgent"
    },
    {
      category: "Sales Pattern",
      title: "₹13,762 sales on May 31 — understand why",
      what_happened: "May 31 was your best day — ₹13,762 in sales, which is 82% higher than the average daily sales of ₹7,545. It was the month-end when people shop after getting their salary.",
      why_it_matters: "If you recognize this pattern, you can stock up extra at month-end and not miss out on sales.",
      do_this_now: "Keep 30% extra stock of Beverages and Snacks on the 28-31 of every month. Place an order with Manoj Traders on the 27th to ensure timely delivery.",
      urgency: "important"
    },
    {
      category: "Expense Alert",
      title: "Rent ₹8,000 + Salary ₹15,810 = 45% of Revenue",
      what_happened: "Fixed costs (rent ₹8,000 + salary ₹15,810) total ₹23,810. This is 45% of this week's total sales. Stock purchase and operations are on top of this.",
      why_it_matters: "With such high fixed costs, a slow week guarantees a loss. You need minimum ₹45,000 weekly sales just to breakeven.",
      do_this_now: "Calculate breakeven: (₹23,810 fixed + avg stock cost) ÷ gross margin. Find this number and set it as your weekly sales target.",
      urgency: "important"
    },
    {
      category: "GST",
      title: "₹2,802 GST input credit — expires if not claimed",
      what_happened: "You paid ₹2,802 GST on purchases this period. This is your input tax credit that can be deducted from GST owed to the government. Net GST liability is only ₹18.",
      why_it_matters: "This credit is claimed when filing GSTR-3B at month-end. If not claimed, this money is lost.",
      do_this_now: "Enter purchases ₹49,993 and ITC ₹2,802 in this month's GSTR-3B. Net payment will be just ₹18. Send this data to your CA today.",
      urgency: "urgent"
    },
    {
      category: "Udhar",
      title: "₹6,400 overdue — this is why cash flow is tight",
      what_happened: "Ramesh Gupta (₹2,500, 12 days overdue), Anil Shinde (₹2,200, 8 days overdue), Ravi Bhor (₹1,700, 5 days overdue) — all three haven't paid yet. This ₹6,400 is double your current profit of ₹2,821.",
      why_it_matters: "This is your money but in someone else's hands. Collecting it is easier than increasing profit.",
      do_this_now: "Call Ramesh Gupta today — 12 days is too long. Accept even a partial ₹1,500. Send a WhatsApp message to Anil. Target to collect at least ₹4,000 this week.",
      urgency: "urgent"
    }
  ],
  udhar_action: "Ramesh Gupta (₹2,500, 12 days overdue) — call today. Send WhatsApp to Anil Shinde (₹2,200). Collect ₹4,000 this week.",
  gst_action: "Claim ₹2,802 ITC in GSTR-3B this month. Net tax payment only ₹18. Share data with CA today.",
  next_week_goal: "Target: ₹58,000 sales next week (+10% from this week). Reason: Month-end bonus effect is over, but you can compensate by keeping extra stock of Snacks and Beverages."
};

const toLang = (str, lang) => {
  if (!str) return str;
  if (lang === 'hindi') {
    const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return str.toString().replace(/\d/g, d => digits[d]);
  }
  return str;
};

const URGENCY_STYLE = {
  urgent: { bg: "bg-red-950/40", border: "border-red-500/40", badge: "bg-red-500", dot: "bg-red-400" },
  important: { bg: "bg-amber-950/30", border: "border-amber-500/30", badge: "bg-amber-500", dot: "bg-amber-400" },
  fyi: { bg: "bg-blue-950/30", border: "border-blue-500/30", badge: "bg-blue-500", dot: "bg-blue-400" },
};

// ── Scorecard row ─────────────────────────────────────────────────────────────
function ScorecardRow({ label, value, language }) {
  const isRed = value.toLowerCase().includes("high") || value.toLowerCase().includes("thin") || value.toLowerCase().includes("overdue") || value.toLowerCase().includes("कम") || value.toLowerCase().includes("ज्यादा");
  const isGreen = value.includes("+") && !isRed;
  return (
    <div className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
      <span className={`text-xs text-right font-mono ${isRed ? "text-red-400" : isGreen ? "text-green-400" : "text-gray-200"}`}>{toLang(value, language)}</span>
    </div>
  );
}

// ── Insight card ──────────────────────────────────────────────────────────────
function InsightCard({ insight, index, language }) {
  const [open, setOpen] = useState(index === 0);
  const style = URGENCY_STYLE[insight.urgency] || URGENCY_STYLE.fyi;
  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${style.badge}`}>
              {insight.urgency.toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-400">{insight.category}</span>
          </div>
          <p className="text-sm font-semibold text-white mt-1">{toLang(insight.title, language)}</p>
        </div>
        <span className="text-gray-500 text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{language === 'hindi' ? "क्या हुआ" : "What Happened"}</p>
            <p className="text-sm text-gray-200 leading-relaxed">{toLang(insight.what_happened, language)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{language === 'hindi' ? "क्यों मायने रखता है" : "Why it Matters"}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{toLang(insight.why_it_matters, language)}</p>
          </div>
          <div className="bg-green-950/50 border border-green-500/30 rounded-lg p-3">
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">{language === 'hindi' ? "✦ अभी करें" : "✦ Do This Now"}</p>
            <p className="text-sm text-green-200 leading-relaxed font-medium">{toLang(insight.do_this_now, language)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chat message ──────────────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs shrink-0 mt-1">AI</div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? "bg-blue-600 text-white rounded-tr-sm"
          : "bg-gray-800 text-gray-100 rounded-tl-sm"
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIAdvisor({ userId = DEMO_USER_ID }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [period, setPeriod] = useState("weekly");
  const [language, setLanguage] = useState("hindi");
  const chatEndRef = useRef(null);

  const activeInsights = (insights && !insights.isMock) ? insights : (language === 'hindi' ? MOCK_INSIGHTS : MOCK_INSIGHTS_EN);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  async function generateInsights() {
    setLoading(true);
    try {
      const res = await fetch(`/api/summary/ai-generate?user_id=${userId}&period=${period}`);
      const data = await res.json();
      
      if (!data.scorecard) {
        throw new Error("Backend not updated to new schema yet");
      }
      
      setInsights(data);
      // Seed chat context with the insights summary
      setMessages([{
        role: "assistant",
        content: language === 'hindi' 
          ? `नमस्ते! मैंने आपके ${period === "weekly" ? "इस हफ्ते" : "इस महीने"} के accounts analyze किए हैं। Insights ऊपर देख सकते हैं। आप मुझसे कुछ भी पूछ सकते हैं — पुराने transactions, किसी customer का udhar, या कोई calculation।`
          : `Hello! I have analyzed your accounts for ${period === "weekly" ? "this week" : "this month"}. You can see the insights above. Ask me anything — past transactions, customer dues, or any calculations.`
      }]);
    } catch {
      setInsights({ isMock: true }); // fallback for demo
      setMessages([{
        role: "assistant",
        content: language === 'hindi'
          ? "नमस्ते! Demo mode में चल रहा हूँ। आप मुझसे business के बारे में कुछ भी पूछ सकते हैं।"
          : "Hello! I am running in Demo mode. You can ask me anything about your business."
      }]);
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || chatLoading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/summary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: String(userId),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: insights?.raw_payload || MOCK_INSIGHTS,
          language: language
        })
      });
      const data = await res.json();
      const reply = data.reply || "माफ़ करें, कुछ गड़बड़ हुई। फिर से try करें।";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Connection issue है। Backend check करें।"
      }]);
    }
    setChatLoading(false);
  }

  // ── render: no insights yet ─────────────────────────────────────────────
  if (!insights && !loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl">🧠</div>
        <div>
          <h3 className="text-white font-bold text-lg">AI Business Advisor</h3>
          <p className="text-gray-400 text-sm mt-1">{language === 'hindi' ? "Detailed insights + conversational Q&A" : "Detailed insights + conversational Q&A"}</p>
        </div>
        <div className="flex gap-2 mb-2">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button 
              onClick={() => setLanguage("hindi")}
              className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${language === "hindi" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              HI
            </button>
            <button 
              onClick={() => setLanguage("english")}
              className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${language === "english" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              EN
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {["weekly", "monthly"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {p === "weekly" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
        <button onClick={generateInsights}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
          Generate Insights →
        </button>
      </div>
    );
  }

  // ── render: loading ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">AI data analyze कर रहा है...</p>
      </div>
    );
  }

  // ── render: insights + chat ─────────────────────────────────────────────
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-3rem)] max-h-[850px]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">🧠</div>
          <div>
            <h3 className="text-white font-bold text-sm">AI Business Advisor</h3>
            <p className="text-gray-500 text-xs">{period === "weekly" ? "Weekly" : "Monthly"} analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button 
              onClick={() => setLanguage("hindi")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${language === "hindi" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              HI
            </button>
            <button 
              onClick={() => setLanguage("english")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${language === "english" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              EN
            </button>
          </div>
          <button onClick={generateInsights}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
            ↺ Refresh
          </button>
          <button onClick={() => setChatOpen(o => !o)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${chatOpen ? "bg-blue-600 text-white" : "bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30"}`}>
            💬 {chatOpen ? "Close Chat" : "Chat"}
          </button>
        </div>
      </div>

      {/* Scrollable Insights Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Headline */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-950/50 to-gray-900 border-b border-gray-700">
          <p className="text-white text-sm font-semibold leading-relaxed">{toLang(activeInsights.headline, language)}</p>
        </div>

        {/* Scorecard */}
        <div className="px-5 py-4 border-b border-gray-700">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Scorecard</p>
          <ScorecardRow label="Sales vs Last Week" value={activeInsights.scorecard.sales_vs_last_week} language={language} />
          <ScorecardRow label="Expense Control" value={activeInsights.scorecard.expense_control} language={language} />
          <ScorecardRow label="Profit Margin" value={activeInsights.scorecard.profit_margin} language={language} />
          <ScorecardRow label="GST Position" value={activeInsights.scorecard.gst_position} language={language} />
          <ScorecardRow label="Udhar Risk" value={activeInsights.scorecard.udhar_risk} language={language} />
        </div>

        {/* Insights */}
        <div className="px-5 py-4 space-y-3 border-b border-gray-700">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{language === 'hindi' ? 'Detailed Insights' : 'Detailed Insights'}</p>
          {activeInsights.insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} language={language} />
          ))}
        </div>

        {/* Footer alerts */}
        <div className="px-5 py-4 space-y-2">
          {activeInsights.udhar_action && (
            <div className="flex gap-2 bg-red-950/30 border border-red-500/30 rounded-xl p-3">
              <span className="text-base shrink-0">⚠️</span>
              <p className="text-xs text-red-200 leading-relaxed">{toLang(activeInsights.udhar_action, language)}</p>
            </div>
          )}
          <div className="flex gap-2 bg-blue-950/30 border border-blue-500/30 rounded-xl p-3">
            <span className="text-base shrink-0">📋</span>
            <p className="text-xs text-blue-200 leading-relaxed">{toLang(activeInsights.gst_action, language)}</p>
          </div>
          <div className="flex gap-2 bg-green-950/30 border border-green-500/30 rounded-xl p-3">
            <span className="text-base shrink-0">🎯</span>
            <p className="text-xs text-green-200 leading-relaxed"><strong>{language === 'hindi' ? 'Next week goal:' : 'Next week goal:'}</strong> {toLang(activeInsights.next_week_goal, language)}</p>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="border-t border-gray-700 shrink-0">
          {/* Messages */}
          <div className="h-40 overflow-y-auto px-4 py-4 space-y-3 bg-gray-950/50">
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {chatLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs shrink-0">AI</div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-gray-800">
            {(language === 'hindi' ? [
              "Ramesh का कितना udhar है?",
              "इस हफ्ते का GST कितना है?",
              "कौन सा दिन सबसे अच्छा रहा?",
              "सबसे बड़ा खर्च कौन सा था?",
            ] : [
              "How much does Ramesh owe?",
              "What is this week's GST?",
              "Which was the best day?",
              "What was the biggest expense?",
            ]).map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                className="shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 px-4 py-3 border-t border-gray-800">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={language === 'hindi' ? "कुछ भी पूछें..." : "Ask anything..."}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button onClick={sendMessage} disabled={!input.trim() || chatLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors">
              {language === 'hindi' ? 'भेजें' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
