import os
import re
import json
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    db = client["debate_assistant"]
    debates_collection = db["debates"]
except Exception as e:
    print(f"MongoDB connection notice: {e}")
    client = MongoClient(MONGO_URI)
    db = client["debate_assistant"]
    debates_collection = db["debates"]

app = FastAPI(title="Debate Assistant AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ask_ai(prompt: str) -> str:
    """Query AI model (Ollama locally by default, or OpenAI if OPENAI_API_KEY is set)."""
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            openai_client = OpenAI(api_key=OPENAI_API_KEY)
            response = openai_client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI API error ({e}), falling back to Ollama...")

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=90
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
    except Exception as e:
        print(f"Ollama request error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to communicate with AI service (Ollama): {str(e)}"
        )


def clean_and_parse_json(text: str) -> dict:
    """Helper to clean markdown code blocks and parse JSON safely."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


class DebateRequest(BaseModel):
    topic: str
    category: str = "General"


class DebateOpponentRequest(BaseModel):
    topic: str
    argument: str


class SkillAnalysisRequest(BaseModel):
    topic: str
    argument: str


class TopicGeneratorRequest(BaseModel):
    category: str = "General"


@app.get("/")
def home():
    return {
        "message": "Debate Assistant AI Backend is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "OK"
    }


@app.post("/generate-arguments")
def generate_arguments(request: DebateRequest):
    prompt = f"""
You are an expert debate assistant.
Generate structured debate arguments for the topic: "{request.topic}" (Category: {request.category}).

Provide:
1. Three strong PRO (FOR) arguments with bullet points and clear reasoning.
2. Three strong CON (AGAINST) arguments with bullet points and clear reasoning.
3. Summary of key points for debate preparation.

Keep the language persuasive, balanced, and articulate.
"""
    ai_text = ask_ai(prompt)
    return {
        "topic": request.topic,
        "category": request.category,
        "ai_response": ai_text
    }


@app.post("/debate-opponent")
def debate_opponent(request: DebateOpponentRequest):
    prompt = f"""
You are an AI debate opponent.

Debate Topic:
{request.topic}

User's Argument:
{request.argument}

Respond as a respectful debate opponent.

Give:
1. A strong counterargument
2. One supporting reason
3. One question for the user

Keep the response clear and concise.
"""
    ai_text = ask_ai(prompt)
    return {
        "topic": request.topic,
        "user_argument": request.argument,
        "opponent_response": ai_text
    }


@app.post("/analyze-debate")
def analyze_debate(request: SkillAnalysisRequest):
    prompt = f"""
You are a debate coach.

Debate Topic:
{request.topic}

Student's Argument:
{request.argument}

Analyze the argument and give a simple debate skill analysis.

Include:
1. Argument Strength — give a score out of 10 (Format: Argument Strength: X/10)
2. Clarity — give a score out of 10 (Format: Clarity: X/10)
3. Reasoning — give a score out of 10 (Format: Reasoning: X/10)
4. Weaknesses
5. Improvement Suggestions

At the end, calculate the overall score out of 10 (Format: Overall Score: X/10).

Keep the feedback constructive and easy to understand.
"""
    ai_text = ask_ai(prompt)
    return {
        "topic": request.topic,
        "argument": request.argument,
        "analysis": ai_text
    }


@app.post("/save-debate")
def save_debate(request: DebateOpponentRequest):
    try:
        debate = {
            "topic": request.topic,
            "argument": request.argument
        }
        result = debates_collection.insert_one(debate)
        return {
            "message": "Debate saved successfully!",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        print(f"Error saving debate to Mongo: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/debates")
def get_debates():
    try:
        debates = list(debates_collection.find())
        for debate in debates:
            debate["_id"] = str(debate["_id"])
        return {
            "debates": debates
        }
    except Exception as e:
        print(f"Error fetching debates: {e}")
        return {
            "debates": []
        }


@app.post("/generate-topic")
def generate_topic(request: TopicGeneratorRequest):
    prompt = f"""
Generate exactly 5 short debate topics for the category: {request.category}

Return ONLY valid JSON.
Do not write any introduction.
Do not write FOR or AGAINST arguments.

Format:
{{
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3",
    "Topic 4",
    "Topic 5"
  ]
}}
"""
    ai_text = ask_ai(prompt)
    try:
        ai_data = clean_and_parse_json(ai_text)
        topics = ai_data.get("topics", [])
    except Exception as e:
        print(f"JSON parsing error: {e}. Raw response: {ai_text}")
        topics = [
            f"Is {request.category} advancing faster than ethical guidelines?",
            f"Should governments regulate {request.category} more strictly?",
            f"The long-term impact of modern {request.category} on society",
            f"Will {request.category} solve or exacerbate global challenges?",
            f"The ethical responsibility of leaders in {request.category}"
        ]

    return {
        "category": request.category,
        "topics": topics
    }
