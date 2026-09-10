import { useEffect, useState } from "react"

function App() {
  const [history, setHistory] = useState([])
  const [topic, setTopic] = useState("")
  const [argument, setArgument] = useState("")
  const [result, setResult] = useState(null)
  const [skillScore, setSkillScore] = useState(null)

  const [loading, setLoading] = useState(false)

  const [opponentResult, setOpponentResult] = useState(null)
  const [opponentLoading, setOpponentLoading] = useState(false)
  const [topicCategory, setTopicCategory] = useState("General")
  const [generatedTopics, setGeneratedTopics] = useState(null)
  const [topicLoading, setTopicLoading] = useState(false)

  const totalDebates = history.length

  // Load debate history
  useEffect(() => {
    fetch("http://127.0.0.1:8000/debates")
      .then((response) => response.json())
      .then((data) => {
        setHistory(data.debates)
      })
      .catch((error) => {
        console.error("History fetch failed:", error)
      })
  }, [])

  // AI Debate Opponent
  const debateOpponent = async () => {
    if (!topic.trim() || !argument.trim()) {
      alert("Please enter both topic and argument")
      return
    }
    

    setOpponentLoading(true)
    setOpponentResult(null)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/debate-opponent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            argument: argument,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error("Backend error")
      }

      setOpponentResult(data)

      console.log("OPPONENT DATA:", data)
    } catch (error) {
      console.error(error)
      alert("AI opponent failed")
    }

    setOpponentLoading(false)
  }
  const generateTopics = async () => {
  setTopicLoading(true)

  try {
    const response = await fetch("http://127.0.0.1:8000/generate-topic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: topicCategory,
      }),
    })

    const data = await response.json()

    setGeneratedTopics(data.topics)
  } catch (error) {
    console.error("TOPIC GENERATOR ERROR:", error)
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
      const response = await fetch(
        "http://127.0.0.1:8000/analyze-debate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            argument: argument,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error("Backend error")
      }

      setResult(data)

      // Extract overall score
      const scoreMatch = data.analysis.match(
        /Overall Score:\s*\**(\d+(?:\.\d+)?)\/10/i
      )

      if (scoreMatch) {
        setSkillScore(scoreMatch[1])
      }

      // Save debate to MongoDB
      const saveResponse = await fetch(
        "http://127.0.0.1:8000/save-debate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            argument: argument,
          }),
        }
      )

      if (!saveResponse.ok) {
        throw new Error("Failed to save debate")
      }

      // Refresh history
      const historyResponse = await fetch(
        "http://127.0.0.1:8000/debates"
      )

      const historyData = await historyResponse.json()

      setHistory(historyData.debates)
    } catch (error) {
      console.error(error)
      alert("AI analysis failed")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">
            🎯
          </div>

          <h1 className="text-4xl md:text-5xl font-bold">
            Debate Skill Analysis
          </h1>

          <p className="text-slate-400 mt-3">
            Get AI feedback on your debate argument
          </p>
        </div>

        {/* Dashboard */}
        <div className="mb-8">

          <h2 className="text-2xl font-bold mb-4">
            📊 Dashboard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Total Debates */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-400 text-sm">
                TOTAL DEBATES
              </p>

              <p className="text-4xl font-bold mt-2">
                {totalDebates}
              </p>
            </div>

            {/* Total Arguments */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-400 text-sm">
                TOTAL ARGUMENTS
              </p>

              <p className="text-4xl font-bold mt-2">
                {history.length}
              </p>
            </div>

            {/* Recent Debates */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-400 text-sm">
                RECENT DEBATES
              </p>

              <p className="text-4xl font-bold mt-2">
                {Math.min(history.length, 3)}
              </p>
            </div>

            {/* AI Skill Score */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-400 text-sm">
                AI SKILL SCORE
              </p>

              <p className="text-4xl font-bold mt-2">
                {skillScore ? `${skillScore}/10` : "—"}
              </p>

              <p className="text-slate-500 text-sm mt-2">
                {skillScore
                  ? "Latest debate analysis score"
                  : "Analyze a debate to get your score"}
              </p>
            </div>

          </div>

          {/* Recent Debates */}
          <div className="mt-6">

            <h3 className="text-xl font-bold mb-3">
              🕒 Recent Debates
            </h3>

            {history.length === 0 ? (
              <p className="text-slate-400">
                No recent debates.
              </p>
            ) : (
              <div className="space-y-3">

                {history
                  .slice(-3)
                  .reverse()
                  .map((debate) => (
                    <div
                      key={debate._id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                    >

                      <p className="font-semibold">
                        {debate.topic}
                      </p>

                      <p className="text-slate-400 text-sm mt-1">
                        {debate.argument}
                      </p>

                    </div>
                  ))}

              </div>
            )}

          </div>

        </div>
        {/* TOPIC GENERATOR */}
<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
  <h2 className="text-xl font-bold text-white mb-2">
    💡 AI Topic Generator
  </h2>

  <p className="text-slate-400 mb-5">
    Generate interesting debate topics using AI.
  </p>

  <div className="flex gap-4 flex-wrap">
    <select
      value={topicCategory}
      onChange={(e) => setTopicCategory(e.target.value)}
      className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-3"
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
      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-lg"
    >
      {topicLoading ? "Generating..." : "✨ Generate Topics"}
    </button>
  </div>

  {generatedTopics && (
    <div className="mt-6 bg-slate-800 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-3">
        Generated Debate Topics
      </h3>

      <div className="space-y-3">
  {generatedTopics.map((topicText, index) => (
  <button
    key={index}
    onClick={() => setTopic(topicText)}
    className="block w-full text-left text-slate-300 bg-slate-700 hover:bg-slate-600 p-4 rounded-lg transition"
  >
    <span className="font-semibold text-white">
      {index + 1}. {topicText}
    </span>
  </button>
))}
</div>
    </div>
  )}
</div>

        {/* Input Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Debate Topic
          </label>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Example: Should AI replace teachers?"
            className="w-full px-4 py-4 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
          />

          <label className="block text-sm font-semibold text-slate-300 mt-6 mb-2">
            Your Argument
          </label>

          <textarea
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            placeholder="Write your debate argument here..."
            rows="7"
            className="w-full px-4 py-4 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none resize-none"
          />

          {/* Buttons */}
          <div className="mt-5 flex flex-wrap gap-3">

            {/* Analyze Button */}
            <button
              onClick={analyzeDebate}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "🤖 Analyzing..."
                : "📊 Analyze My Debate"}
            </button>

            {/* Challenge Button */}
            <button
              onClick={debateOpponent}
              disabled={opponentLoading}
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {opponentLoading
                ? "🤖 Thinking..."
                : "🤖 Challenge Me"}
            </button>

          </div>

        </div>

        {/* AI Analysis Result */}
        {result && (
          <div className="mt-8 space-y-6">

            {/* Topic */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

              <p className="text-sm text-slate-400">
                DEBATE TOPIC
              </p>

              <h2 className="text-2xl font-bold mt-2">
                {result.topic}
              </h2>

            </div>

            {/* Argument */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

              <h2 className="text-xl font-bold mb-3">
                🧑 Your Argument
              </h2>

              <p className="text-slate-300 leading-7">
                {result.argument}
              </p>

            </div>

            {/* AI Skill Analysis */}
            <div className="bg-slate-900 border border-blue-900 rounded-2xl p-6">

              <div className="flex items-center gap-3 mb-5">

                <span className="text-3xl">
                  🤖
                </span>

                <div>

                  <h2 className="text-2xl font-bold">
                    AI Skill Analysis
                  </h2>

                  <p className="text-sm text-slate-400">
                    Powered by Llama 3.2
                  </p>

                </div>

              </div>

              <div className="bg-slate-800 rounded-xl p-5">

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    <div className="bg-slate-900 rounded-xl p-5 text-center border border-blue-800">
      <p className="text-slate-400 text-sm">
        Argument Strength
      </p>

      <p className="text-3xl font-bold text-blue-400 mt-2">
        {result.analysis.match(/Argument Strength.*?(\d+\/10)/)?.[1] || "—"}
      </p>
    </div>

    <div className="bg-slate-900 rounded-xl p-5 text-center border border-green-800">
      <p className="text-slate-400 text-sm">
        Clarity
      </p>

      <p className="text-3xl font-bold text-green-400 mt-2">
        {result.analysis.match(/Clarity.*?(\d+\/10)/)?.[1] || "—"}
      </p>
    </div>

    <div className="bg-slate-900 rounded-xl p-5 text-center border border-purple-800">
      <p className="text-slate-400 text-sm">
        Reasoning
      </p>

      <p className="text-3xl font-bold text-purple-400 mt-2">
        {result.analysis.match(/Reasoning.*?(\d+\/10)/)?.[1] || "—"}
      </p>
    </div>

  </div>

  <div className="mt-6 bg-slate-900 rounded-xl p-5">
    <h3 className="text-lg font-bold text-white mb-3">
      📝 Detailed Feedback
    </h3>

    <p className="whitespace-pre-wrap text-slate-200 leading-8">
      {result.analysis}
    </p>
  </div>

</div>


            </div>

          </div>
        )}

        {/* AI Debate Opponent */}
        {opponentResult && (
          <div className="mt-8 bg-slate-900 border border-purple-900 rounded-2xl p-6">

            <div className="flex items-center gap-3 mb-5">

              <span className="text-3xl">
                🤖
              </span>

              <div>

                <h2 className="text-2xl font-bold">
                  AI Debate Opponent
                </h2>

                <p className="text-sm text-slate-400">
                  Powered by Llama 3.2
                </p>

              </div>

            </div>

            <div className="bg-slate-800 rounded-xl p-5">

              <p className="whitespace-pre-wrap text-slate-200 leading-8">
                {opponentResult.opponent_response}
              </p>

            </div>

          </div>
        )}

        {/* Debate History */}
        <div className="mt-8">

          <h2 className="text-2xl font-bold mb-4">
            📚 Debate History
          </h2>

          {history.length === 0 ? (
            <p className="text-slate-400">
              No debates saved yet.
            </p>
          ) : (
            <div className="space-y-4">

              {history.map((debate) => (
                <div
                  key={debate._id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                >

                  <h3 className="text-lg font-bold">
                    {debate.topic}
                  </h3>

                  <p className="text-slate-400 mt-2">
                    {debate.argument}
                  </p>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm mt-10">
          Debate Assistant AI • Skill Analysis
        </div>

      </div>
    </div>
  )
}

export default App