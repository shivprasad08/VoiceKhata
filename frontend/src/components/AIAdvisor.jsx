import { useState, useEffect, useRef } from "react";

const DEMO_USER_ID = "demo-rajesh-001";

const MOCK_INSIGHTS_HI = {
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
      what_happened: "31 May आपका best day था — ₹13,762 की sale, जो average daily sales ₹7,545 से 82% ज्यादा है। यह महीने का आखिरी दिन था যখন लोग salary मिलने के बाद खरीदारी करते हैं।",
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
  next_week_goal: "Target: ₹58,000 sales next week (+10% from this week)। month-end bonus effect खत्म हुआ लेकिन Snacks और Beverages में extra stock लेकर compensate कर सकते हैं।"
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
      why_it_matters: "If sales drop even slightly next week, you will face a loss. This is not sustainable.",
      do_this_now: "Review helper's working hours. If 2-5 PM is slow, you don't need a helper for that shift. This can save ₹3,000-4,000 monthly.",
      urgency: "urgent"
    },
    {
      category: "Sales Pattern",
      title: "₹13,762 sales on May 31 — understand the pattern",
      what_happened: "May 31 was your best day — ₹13,762 in sales, 82% higher than the average daily sales of ₹7,545. It was month-end when people shop after getting their salary.",
      why_it_matters: "If you recognize this pattern, you can stock up extra at month-end and not miss out on sales.",
      do_this_now: "Keep 30% extra stock of Beverages and Snacks on the 28-31 of every month. Place order with Manoj Traders on the 27th for timely delivery.",
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
      what_happened: "Ramesh Gupta (₹2,500, 12 days overdue), Anil Shinde (₹2,200, 8 days overdue), Ravi Bhor (₹1,700, 5 days overdue) — all three haven't paid. This ₹6,400 is double your current profit of ₹2,821.",
      why_it_matters: "This is your money but in someone else's hands. Collecting it is easier than increasing profit.",
      do_this_now: "Call Ramesh Gupta today — 12 days is too long. Accept even a partial ₹1,500. Send WhatsApp to Anil. Target to collect at least ₹4,000 this week.",
      urgency: "urgent"
    }
  ],
  udhar_action: "Ramesh Gupta (₹2,500, 12 days overdue) — call today. Send WhatsApp to Anil Shinde (₹2,200). Collect ₹4,000 this week.",
  gst_action: "Claim ₹2,802 ITC in GSTR-3B this month. Net tax payment only ₹18. Share data with CA today.",
  next_week_goal: "Target: ₹58,000 sales next week (+10% from this week). Month-end bonus effect is over, but you can compensate by stocking extra Snacks and Beverages."
};

const URGENCY_STYLE = {
  urgent: { bg: "bg-red-50", border: "border-red-200", badge: "bg-khata-red", dot: "bg-red-500", text: "text-red-900" },
  important: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-500", dot: "bg-amber-500", text: "text-amber-900" },
  fyi: { bg: "bg-[#00BAF2]-light", border: "border-[#00BAF2]/30", badge: "bg-[#00BAF2]", dot: "bg-[#00BAF2]", text: "text-[#002970]" },
};

const L = {
  hi: {
    title: "AI Business Advisor",
    subtitle_weekly: "Weekly analysis",
    subtitle_monthly: "Monthly analysis",
    desc: "Detailed insights + conversational Q&A",
    this_week: "This Week",
    this_month: "This Month",
    generate: "Generate Insights →",
    refresh: "↺ Refresh",
    chat: "Chat",
    close_chat: "Close Chat",
    loading: "AI data analyze कर रहा है...",
    scorecard: "Scorecard",
    detailed: "Detailed Insights",
    what_happened: "क्या हुआ",
    why_matters: "क्यों मायने रखता है",
    do_now: "✦ अभी करें",
    next_goal: "अगले हफ्ते का लक्ष्य:",
    send: "भेजें",
    placeholder: "कुछ भी पूछें...",
    quick: ["Ramesh का कितना udhar है?", "इस हफ्ते का GST कितना है?", "सबसे बड़ा खर्च कौन सा था?"],
    welcome_live: (p) => `नमस्ते! मैंने आपके ${p === "weekly" ? "इस हफ्ते" : "इस महीने"} के accounts analyze किए हैं। Insights ऊपर देख सकते हैं। कुछ भी पूछें!`,
    welcome_demo: "नमस्ते! Demo mode में चल रहा हूँ। आप मुझसे business के बारे में कुछ भी पूछ सकते हैं।",
    conn_err: "Connection issue है। Backend check करें।",
    scorecard_labels: {
      sales: "Sales vs Last Wk",
      expense: "Expense Control",
      margin: "Profit Margin",
      gst: "GST Position",
      udhar: "Udhar Risk",
    }
  },
  en: {
    title: "AI Business Advisor",
    subtitle_weekly: "Weekly analysis",
    subtitle_monthly: "Monthly analysis",
    desc: "Detailed insights + conversational Q&A",
    this_week: "This Week",
    this_month: "This Month",
    generate: "Generate Insights →",
    refresh: "↺ Refresh",
    chat: "Chat",
    close_chat: "Close Chat",
    loading: "AI is analyzing data...",
    scorecard: "Scorecard",
    detailed: "Detailed Insights",
    what_happened: "What Happened",
    why_matters: "Why It Matters",
    do_now: "✦ Do This Now",
    next_goal: "Next week goal:",
    send: "Send",
    placeholder: "Ask anything...",
    quick: ["How much does Ramesh owe?", "What is this week's GST?", "What was the biggest expense?"],
    welcome_live: (p) => `Hello! I have analyzed your ${p === "weekly" ? "this week's" : "this month's"} accounts. You can see insights above. Ask me anything!`,
    welcome_demo: "Hello! Running in Demo mode. You can ask me anything about your business.",
    conn_err: "Connection issue. Please check the backend.",
    scorecard_labels: {
      sales: "Sales vs Last Wk",
      expense: "Expense Control",
      margin: "Profit Margin",
      gst: "GST Position",
      udhar: "Udhar Risk",
    }
  }
};

function ScorecardRow({ label, value }) {
  const isRed = value.toLowerCase().includes("high") || value.toLowerCase().includes("thin") || value.toLowerCase().includes("overdue") || value.toLowerCase().includes("कम") || value.toLowerCase().includes("ज्यादा") || value.toLowerCase().includes("too");
  const isGreen = value.includes("+") && !isRed;
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs text-[#707070] font-bold w-28 shrink-0">{label}</span>
      <span className={`text-xs text-right font-mono font-bold ${isRed ? "text-khata-red" : isGreen ? "text-khata-green" : "text-[#101010]"}`}>{value}</span>
    </div>
  );
}

function InsightCard({ insight, index, lang }) {
  const [open, setOpen] = useState(index === 0);
  const style = URGENCY_STYLE[insight.urgency] || URGENCY_STYLE.fyi;
  const t = L[lang];
  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all shadow-sm`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/40 transition-colors">
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${style.badge}`}>{insight.urgency.toUpperCase()}</span>
            <span className="text-[10px] text-[#707070] font-bold uppercase">{insight.category}</span>
          </div>
          <p className="text-sm font-bold text-[#101010] mt-1.5">{insight.title}</p>
        </div>
        <span className="text-[#707070] text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-black/5 pt-3">
          <div>
            <p className="text-[10px] font-bold text-[#707070] uppercase tracking-wider mb-1">{t.what_happened}</p>
            <p className={`text-sm ${style.text} leading-relaxed font-medium`}>{insight.what_happened}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#707070] uppercase tracking-wider mb-1">{t.why_matters}</p>
            <p className={`text-sm ${style.text} leading-relaxed font-medium opacity-80`}>{insight.why_it_matters}</p>
          </div>
          <div className="bg-white border border-[#E8EBF0] rounded-lg p-3 shadow-sm">
            <p className="text-[10px] font-bold text-[#00BAF2] uppercase tracking-wider mb-1">{t.do_now}</p>
            <p className="text-sm text-[#101010] leading-relaxed font-bold">{insight.do_this_now}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (<div className="w-7 h-7 rounded-full bg-[#00BAF2]-light border border-[#00BAF2]/20 flex items-center justify-center text-[10px] shrink-0 mt-1 font-bold text-[#00BAF2]">AI</div>)}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed font-medium ${isUser ? "bg-[#00BAF2] text-white rounded-tr-sm shadow-sm" : "bg-white border border-[#E8EBF0] text-[#101010] rounded-tl-sm shadow-sm"}`}>
        {msg.content}
      </div>
    </div>
  );
}

function LangToggle({ lang, setLang }) {
  return (
    <div className="flex bg-[#F5F8FA] border border-[#E8EBF0] rounded-lg p-0.5">
      <button
        onClick={() => setLang("hi")}
        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${lang === "hi" ? "bg-white text-[#101010] shadow-sm" : "text-[#707070] hover:text-[#101010]"}`}
      >
        HI
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${lang === "en" ? "bg-white text-[#101010] shadow-sm" : "text-[#707070] hover:text-[#101010]"}`}
      >
        EN
      </button>
    </div>
  );
}

export default function AIAdvisor({ userId = DEMO_USER_ID }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [period, setPeriod] = useState("weekly");
  const [lang, setLang] = useState("hi");
  const chatEndRef = useRef(null);

  const t = L[lang];
  const mockData = lang === "hi" ? MOCK_INSIGHTS_HI : MOCK_INSIGHTS_EN;
  const activeInsights = (insights && !insights._isMock) ? insights : mockData;

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  async function generateInsights() {
    setLoading(true);
    try {
      const res = await fetch(`/api/summary/ai-generate?user_id=${userId}&period=${period}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (!data.scorecard || !data.headline) throw new Error("Invalid response structure");
      if (data.insights && data.insights.length === 0) throw new Error("Backend returned empty insights due to AI error");
      setInsights(data);
      setMessages([{ role: "assistant", content: t.welcome_live(period) }]);
    } catch {
      setInsights({ _isMock: true });
      setMessages([{ role: "assistant", content: t.welcome_demo }]);
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
        body: JSON.stringify({ messages: newMessages, context: insights?.raw_payload || mockData, user_id: String(userId), language: lang === "en" ? "english" : "hindi" })
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: t.conn_err }]);
    }
    setChatLoading(false);
  }

  if (!insights && !loading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-3xl p-8 flex flex-col items-center gap-5 text-center shadow-paytm">
        <div className="w-16 h-16 rounded-3xl bg-[#00BAF2]-light border border-[#00BAF2]/20 flex items-center justify-center text-3xl shadow-sm">🧠</div>
        <div>
          <h3 className="text-[#101010] font-bold text-xl">{t.title}</h3>
          <p className="text-[#707070] text-sm mt-1 font-medium">{t.desc}</p>
        </div>
        <LangToggle lang={lang} setLang={setLang} />
        <div className="flex gap-2 w-full">
          {["weekly", "monthly"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${period === p ? "bg-[#002970] text-white shadow-md" : "bg-[#F5F8FA] border border-[#E8EBF0] text-[#707070] hover:bg-gray-100"}`}>
              {p === "weekly" ? t.this_week : t.this_month}
            </button>
          ))}
        </div>
        <button onClick={generateInsights} className="w-full py-3.5 bg-[#00BAF2] hover:bg-[#00BAF2]-hover text-white font-bold rounded-2xl transition-all shadow-paytm mt-2">
          {t.generate}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-3xl p-10 flex flex-col items-center gap-4 shadow-paytm">
        <div className="w-10 h-10 border-4 border-[#00BAF2] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#101010] font-bold">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-3rem)] max-h-[850px] shadow-paytm">

      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EBF0] shrink-0 bg-white z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00BAF2]-light border border-[#00BAF2]/20 flex items-center justify-center text-lg">🧠</div>
          <div>
            <h3 className="text-[#002970] font-bold text-base">{t.title}</h3>
            <p className="text-[#707070] text-xs font-bold">{period === "weekly" ? t.subtitle_weekly : t.subtitle_monthly}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle lang={lang} setLang={setLang} />
          <button onClick={() => setChatOpen(o => !o)} className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${chatOpen ? "bg-[#002970] text-white shadow-md" : "bg-[#00BAF2]-light text-[#00BAF2] hover:bg-[#00BAF2] hover:text-white"}`}>
            💬 {chatOpen ? t.close_chat : t.chat}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent bg-[#F5F8FA]">

        <div className="px-6 py-5 bg-[#00BAF2]-light border-b border-[#E8EBF0]">
          <p className="text-[#002970] text-sm font-bold leading-relaxed">{activeInsights.headline}</p>
        </div>

        <div className="px-6 py-5 border-b border-[#E8EBF0] bg-white mb-2">
          <p className="text-[10px] text-[#707070] uppercase tracking-wider font-bold mb-3">{t.scorecard}</p>
          <ScorecardRow label={t.scorecard_labels.sales} value={activeInsights.scorecard.sales_vs_last_week} />
          <ScorecardRow label={t.scorecard_labels.expense} value={activeInsights.scorecard.expense_control} />
          <ScorecardRow label={t.scorecard_labels.margin} value={activeInsights.scorecard.profit_margin} />
          <ScorecardRow label={t.scorecard_labels.gst} value={activeInsights.scorecard.gst_position} />
          <ScorecardRow label={t.scorecard_labels.udhar} value={activeInsights.scorecard.udhar_risk} />
        </div>

        <div className="px-6 py-5 space-y-4 border-b border-[#E8EBF0] bg-white">
          <p className="text-[10px] text-[#707070] uppercase tracking-wider font-bold">{t.detailed}</p>
          {activeInsights.insights.map((insight, i) => (<InsightCard key={i} insight={insight} index={i} lang={lang} />))}
        </div>

        <div className="px-6 py-6 space-y-3 bg-white">
          {activeInsights.udhar_action && (
            <div className="flex gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm">
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <p className="text-sm text-red-900 leading-relaxed font-bold">{activeInsights.udhar_action}</p>
            </div>
          )}
          <div className="flex gap-3 bg-[#00BAF2]-light border border-[#00BAF2]/20 rounded-2xl p-4 shadow-sm">
            <span className="text-xl shrink-0 mt-0.5">📋</span>
            <p className="text-sm text-[#002970] leading-relaxed font-bold">{activeInsights.gst_action}</p>
          </div>
          <div className="flex gap-3 bg-green-50 border border-green-100 rounded-2xl p-4 shadow-sm">
            <span className="text-xl shrink-0 mt-0.5">🎯</span>
            <p className="text-sm text-green-900 leading-relaxed"><strong className="text-green-800">{t.next_goal}</strong> {activeInsights.next_week_goal}</p>
          </div>
        </div>
      </div>

      {chatOpen && (
        <div className="border-t border-[#E8EBF0] shrink-0 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-20">
          <div className="h-56 overflow-y-auto px-4 py-4 space-y-3 bg-[#F5F8FA] scrollbar-thin scrollbar-thumb-gray-200">
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {chatLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#00BAF2]-light flex items-center justify-center text-[10px] shrink-0 font-bold text-[#00BAF2]">AI</div>
                <div className="bg-white border border-[#E8EBF0] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-white border-t border-[#E8EBF0] scrollbar-none">
            {t.quick.map(q => (
              <button key={q} onClick={() => setInput(q)} className="shrink-0 text-xs font-bold bg-[#F5F8FA] border border-[#E8EBF0] hover:bg-gray-100 text-[#101010] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">{q}</button>
            ))}
          </div>
          <div className="flex gap-2 px-4 py-3 border-t border-[#E8EBF0] bg-white">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder={t.placeholder} className="flex-1 bg-[#F5F8FA] border border-[#E8EBF0] rounded-xl px-4 py-2.5 text-sm text-[#101010] font-medium placeholder-gray-400 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] transition-all" />
            <button onClick={sendMessage} disabled={!input.trim() || chatLoading} className="px-5 py-2.5 bg-[#00BAF2] hover:bg-[#00BAF2]-hover disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md">
              {t.send}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
