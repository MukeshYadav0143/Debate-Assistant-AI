import { useEffect, useState } from "react"
import confetti from "canvas-confetti"
import {
  Sparkles,
  Swords,
  BarChart3,
  Brain,
  History,
  CheckCircle2,
  Award,
  Zap,
  RefreshCw,
  Lightbulb,
  User,
  Flame,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Copy,
  Check,
  Scale,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const QUICK_TOPICS = [
  "Should AI replace teachers in classrooms?",
  "Should governments mandate 100% renewable energy by 2035?",
  "Should social media platforms enforce strict age limits?",
  "Are autonomous vehicles safer than human drivers?"
]

function App() {
  const [history, setHistory] = useState([])
  const [topic, setTopic] = useState("")
  const [argument, setArgument] = useState("")
  const [result, setResult] = useState(null)
  const [skillScore, setSkillScore] = useState(null)

  const [loading, setLoading] = useState(false)
  const [opponentResult, setOpponentResult] = useState(null)
  const [opponentLoading, setOpponentLoading] = useState(false)
  const [argsResult, setArgsResult] = useState(null)
  const [argsLoading, setArgsLoading] = useState(false)

  const [topicCategory, setTopicCategory] = useState("General")
  const [generatedTopics, setGeneratedTopics] = useState(null)
  const [topicLoading, setTopicLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)

  const totalDebates = history.length

  // Load debate history
  useEffect(() => {
    fetch(`${API_BASE_URL}/debates`)
      .then((response) => response.json())
      .then((data) => {
        setHistory(data.debates || [])
      })
      .catch((error) => {
        console.error("History fetch failed:", error)
      })
  }, [])

  // Parse numeric score out of string like "8/10" or "8"
  const parseScoreValue = (str) => {
    if (!str) return null
    const match = str.match(/(\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : null
  }

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#a855f7", "#3b82f6", "#10b981", "#f59e0b"]
      })
    } catch (e) {
      // ignore if canvas not supported
    }
  }

  // Copy to clipboard helper
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // AI Debate Opponent
  const debateOpponent = async () => {
    if (!topic.trim() || !argument.trim()) {
      alert("Please enter both topic and argument")
      return
    }

    setOpponentLoading(true)
    setOpponentResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/debate-opponent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          argument: argument,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Backend error")
      }

      setOpponentResult(data)
    } catch (error) {
      console.error(error)
      alert(`AI opponent failed: ${error.message}`)
    } finally {
      setOpponentLoading(false)
    }
  }

  // Generate Pro/Con Arguments
  const generateArguments = async () => {
    if (!topic.trim()) {
      alert("Please enter a debate topic first")
      return
    }

    setArgsLoading(true)
    setArgsResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/generate-arguments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          category: topicCategory,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate arguments")
      }

      setArgsResult(data)
    } catch (error) {
      console.error("ARGS ERROR:", error)
      alert(`Arguments generation failed: ${error.message}`)
    } finally {
      setArgsLoading(false)
    }
  }

  const generateTopics = async () => {
    setTopicLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/generate-topic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: topicCategory,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate topics")
      }

      setGeneratedTopics(data.topics || [])
    } catch (error) {
      console.error("TOPIC GENERATOR ERROR:", error)
      alert(`Topic generation failed: ${error.message}`)
    } finally {
      setTopicLoading(false)
    }
  }

  // Analyze Debate
  const analyzeDebate = async () => {
    if (!topic.trim() || !argument.trim()) {
      alert("Please enter both topic and argument")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-debate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          argument: argument,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Backend error")
      }

      setResult(data)

      // Extract overall score
      const scoreMatch =
        data.analysis?.match(/Overall Score:\s*\**(\d+(?:\.\d+)?)\/10/i) ||
        data.analysis?.match(/(\d+(?:\.\d+)?)\s*\/\s*10/)

      if (scoreMatch) {
        const scoreNum = scoreMatch[1]
        setSkillScore(scoreNum)
        if (parseFloat(scoreNum) >= 6) {
          triggerConfetti()
        }
      }

      // Save debate to MongoDB
      const saveResponse = await fetch(`${API_BASE_URL}/save-debate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          argument: argument,
        }),
      })

      if (saveResponse.ok) {
        // Refresh history
        const historyResponse = await fetch(`${API_BASE_URL}/debates`)
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          setHistory(historyData.debates || [])
        }
      }
    } catch (error) {
      console.error(error)
      alert(`AI analysis failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Sub-scores extraction
  const strengthMatch = result?.analysis?.match(/Argument Strength.*?:?\s*\*?\*?(\d+(?:\.\d+)?(?:\s*\/\s*10)?)/i)?.[1]
  const clarityMatch = result?.analysis?.match(/Clarity.*?:?\s*\*?\*?(\d+(?:\.\d+)?(?:\s*\/\s*10)?)/i)?.[1]
  const reasoningMatch = result?.analysis?.match(/Reasoning.*?:?\s*\*?\*?(\d+(?:\.\d+)?(?:\s*\/\s*10)?)/i)?.[1]

  const strengthVal = parseScoreValue(strengthMatch) || 7
  const clarityVal = parseScoreValue(clarityMatch) || 8
  const reasoningVal = parseScoreValue(reasoningMatch) || 7

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans selection:bg-purple-600 selection:text-white">
      {/* Background Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="pointer-events-none absolute bottom-10 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        
        {/* Header with Floating Animated Badge */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-blue-500 shadow-xl shadow-purple-500/25 mb-5 animate-float">
            <span className="text-4xl">🎯</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Debate Assistant AI
          </h1>

          <p className="text-slate-400 mt-3 text-base sm:text-lg max-w-xl mx-auto flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: "8s" }} />
            <span>Sharpen your arguments with real-time AI debate coaching</span>
          </p>
        </header>

        {/* Developer Profile Section Card */}
        <section className="group relative bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-purple-800/40 hover:border-purple-500/60 rounded-2xl p-5 mb-8 transition-all duration-300 shadow-lg shadow-purple-950/20 hover:shadow-purple-900/30 animate-glow-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform duration-300">
                  👨‍💻
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-bold text-white text-lg tracking-wide">Mukesh Yadav</h2>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
                    <Award className="w-3 h-3" /> Lead Developer
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <strong className="text-purple-300">BBD University</strong>
                  <span className="text-slate-600">•</span>
                  <span>BCA (Data Science & AI), 2nd Year</span>
                </p>
              </div>
            </div>

            <a
              href="https://github.com/MukeshYadav0143"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-purple-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-purple-500 text-xs font-semibold transition-all duration-300 group-hover:shadow-lg shrink-0"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>GitHub Profile</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </section>

        {/* Dashboard Metrics Grid */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <span>Live Dashboard</span>
            </h2>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              MongoDB Connected
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Debates */}
            <div className="bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Total Debates</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-3xl sm:text-4xl font-black mt-2 text-white">
                {totalDebates}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Sessions recorded</p>
            </div>

            {/* Total Arguments */}
            <div className="bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Arguments</span>
                <Brain className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl sm:text-4xl font-black mt-2 text-white">
                {history.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">User viewpoints</p>
            </div>

            {/* Recent Debates */}
            <div className="bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Recent</span>
                <History className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-3xl sm:text-4xl font-black mt-2 text-white">
                {Math.min(history.length, 3)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Last rounds saved</p>
            </div>

            {/* AI Skill Score */}
            <div className="bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-800/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-purple-500/60">
              <div className="flex items-center justify-between text-purple-300 text-xs font-semibold uppercase tracking-wider">
                <span>AI Skill Score</span>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-3xl sm:text-4xl font-black mt-2 bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-200 bg-clip-text text-transparent">
                {skillScore ? `${skillScore}/10` : "—"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {skillScore ? "Latest evaluation" : "Analyze to calculate"}
              </p>
            </div>
          </div>
        </section>

        {/* AI TOPIC GENERATOR */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">
              AI Topic Generator
            </h2>
          </div>

          <p className="text-slate-400 text-sm mb-5">
            Pick a domain and let Llama 3.2 synthesize balanced, high-impact debate motions.
          </p>

          <div className="flex gap-3 flex-wrap items-center">
            <select
              value={topicCategory}
              onChange={(e) => setTopicCategory(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700/80 hover:border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors cursor-pointer"
            >
              <option value="General">General</option>
              <option value="Technology">Technology</option>
              <option value="Education">Education</option>
              <option value="Environment">Environment</option>
              <option value="Social Media">Social Media</option>
              <option value="Science">Science</option>
            </select>

            <button
              onClick={generateTopics}
              disabled={topicLoading}
              className="relative overflow-hidden group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-md shadow-purple-600/20 hover:shadow-purple-600/40 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {topicLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Topics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Topics</span>
                </>
              )}
            </button>
          </div>

          {generatedTopics && (
            <div className="mt-6 bg-slate-800/70 border border-slate-700/60 rounded-xl p-5 animate-fade-in">
              <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Generated Motions (Click to Select)</span>
              </h3>

              <div className="space-y-2.5">
                {generatedTopics.map((topicText, index) => (
                  <button
                    key={index}
                    onClick={() => setTopic(topicText)}
                    className="w-full text-left text-slate-300 bg-slate-900/80 hover:bg-purple-950/40 hover:text-white border border-slate-800 hover:border-purple-500/50 p-3.5 rounded-xl transition-all duration-200 group flex items-start gap-3 cursor-pointer"
                  >
                    <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium leading-relaxed">
                      {topicText}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-purple-400 transition-opacity shrink-0 self-center" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Input Card */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
          {/* Quick topic presets */}
          <div className="mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 block">
              Quick Pick Topics:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_TOPICS.map((qTopic, idx) => (
                <button
                  key={idx}
                  onClick={() => setTopic(qTopic)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-slate-700/60 hover:border-purple-500/50 transition-all cursor-pointer hover:scale-102"
                >
                  {qTopic}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Debate Topic</span>
            <span className="text-xs text-slate-500 font-normal">Choose from above or write your own</span>
          </label>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Example: Should AI replace teachers in classrooms?"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-slate-500 text-sm sm:text-base text-white"
          />

          <label className="block text-sm font-semibold text-slate-300 mt-5 mb-2 flex items-center justify-between">
            <span>Your Argument</span>
            <span className="text-xs text-slate-500 font-normal">{argument.length} characters</span>
          </label>

          <textarea
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            placeholder="State your main claims, premise, evidence, and logical reasoning here..."
            rows="6"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-slate-500 text-sm sm:text-base text-white resize-none"
          />

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3.5">
            {/* Analyze Button */}
            <button
              onClick={analyzeDebate}
              disabled={loading || opponentLoading || argsLoading}
              className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95 flex items-center gap-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Debate...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span>Analyze My Debate</span>
                </>
              )}
            </button>

            {/* Challenge Opponent Button */}
            <button
              onClick={debateOpponent}
              disabled={opponentLoading || loading || argsLoading}
              className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 active:scale-95 flex items-center gap-2.5 cursor-pointer"
            >
              {opponentLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Opponent Thinking...</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  <span>Challenge AI Opponent</span>
                </>
              )}
            </button>

            {/* Pro/Con Generator Button */}
            <button
              onClick={generateArguments}
              disabled={argsLoading || loading || opponentLoading}
              className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 active:scale-95 flex items-center gap-2.5 cursor-pointer"
            >
              {argsLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Arguments...</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>Generate Pro/Con Arguments</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Animated Loading Shimmer State */}
        {(loading || opponentLoading || argsLoading) && (
          <section className="mt-8 bg-slate-900/90 border border-purple-800/40 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>AI Engine Thinking</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </span>
                </h3>
                <p className="text-xs text-purple-300">Processing argument with Llama 3.2...</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="h-3.5 bg-slate-800/80 rounded w-full animate-shimmer" />
              <div className="h-3.5 bg-slate-800/80 rounded w-4/5 animate-shimmer" />
              <div className="h-3.5 bg-slate-800/80 rounded w-3/5 animate-shimmer" />
            </div>
          </section>
        )}

        {/* AI Analysis Result */}
        {result && (
          <section className="mt-8 space-y-6 animate-fade-in">
            {/* Topic & User Argument Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-400" /> Motion Examined
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">{result.topic}</h2>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-start gap-3">
                <User className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Your Submission</p>
                  <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{result.argument}</p>
                </div>
              </div>
            </div>

            {/* AI Skill Analysis Card */}
            <div className="bg-slate-900/95 border border-purple-900/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Skill Scorecard</h2>
                    <p className="text-xs text-purple-300">Powered by Llama 3.2 • Local Inference</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {skillScore && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-700/60 text-purple-200">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <span className="text-xs uppercase font-semibold">Overall:</span>
                      <strong className="text-lg font-black text-white">{skillScore}/10</strong>
                    </div>
                  )}

                  <button
                    onClick={() => copyToClipboard(result.analysis, "analysis")}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedKey === "analysis" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Score Progress Meters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Strength */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-blue-900/50">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Argument Strength</span>
                    <strong className="text-blue-400 font-bold">{strengthMatch || "—"}</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, strengthVal * 10)}%` }}
                    />
                  </div>
                </div>

                {/* Clarity */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-emerald-900/50">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Clarity</span>
                    <strong className="text-emerald-400 font-bold">{clarityMatch || "—"}</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-green-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, clarityVal * 10)}%` }}
                    />
                  </div>
                </div>

                {/* Reasoning */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-purple-900/50">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Reasoning</span>
                    <strong className="text-purple-400 font-bold">{reasoningMatch || "—"}</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, reasoningVal * 10)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📝 Comprehensive Coach Feedback</span>
                </h3>
                <p className="whitespace-pre-wrap text-slate-300 leading-relaxed text-sm sm:text-base">
                  {result.analysis}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* AI Pro/Con Arguments Result */}
        {argsResult && (
          <section className="mt-8 bg-slate-900/95 border border-emerald-900/70 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                  ⚖️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Structured Pro & Con Arguments</span>
                  </h2>
                  <p className="text-xs text-emerald-300">Topic: {argsResult.topic}</p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(argsResult.ai_response, "args")}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedKey === "args" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-5">
              <p className="whitespace-pre-wrap text-slate-200 leading-relaxed text-sm sm:text-base">
                {argsResult.ai_response}
              </p>
            </div>
          </section>
        )}

        {/* AI Debate Opponent Result */}
        {opponentResult && (
          <section className="mt-8 bg-slate-900/95 border border-purple-900/70 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-xl shrink-0">
                  ⚔️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>AI Opponent Counter-Strike</span>
                  </h2>
                  <p className="text-xs text-purple-300">Respectful Counter-Argument & Challenge</p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(opponentResult.opponent_response, "opponent")}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedKey === "opponent" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-5">
              <p className="whitespace-pre-wrap text-slate-200 leading-relaxed text-sm sm:text-base">
                {opponentResult.opponent_response}
              </p>
            </div>
          </section>
        )}

        {/* Debate History */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <History className="w-5 h-5 text-purple-400" />
              <span>Debate Vault ({history.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Persisted in MongoDB</span>
          </div>

          {history.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <p>No debates saved yet. Submit an argument above to start your log!</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {history.slice(-5).reverse().map((debate, i) => (
                <div
                  key={debate._id || i}
                  className="bg-slate-900/80 hover:bg-slate-800/70 border border-slate-800 hover:border-purple-800/50 rounded-2xl p-5 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-white text-base group-hover:text-purple-300 transition-colors">
                      {debate.topic}
                    </h3>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Saved
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                    {debate.argument}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center mt-14 pt-8 border-t border-slate-800/80">
          <p className="text-slate-400 text-sm font-medium">
            Debate Assistant AI • Empowering Next-Gen Debaters with Local AI
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-400 hover:border-purple-500/40 transition-colors">
            <span>Built with ❤️ by <strong className="text-slate-200">Mukesh Yadav</strong></span>
            <span>•</span>
            <span className="text-purple-400 font-medium">BBD University (BCA DS-AI, 2nd Year)</span>
          </div>
        </footer>

      </div>
    </div>
  )
}

export default App