from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from pymongo import MongoClient

import os
from openai import OpenAI
openai_client = OpenAI()
client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
db = client["debate_assistant"]
debates_collection = db["debates"]

app = FastAPI(title="Debate Assistant AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://debate-assistant-ai-one.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DebateRequest(BaseModel):
    topic: str
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

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False
        }
    )

    response.raise_for_status()

    ai_text = response.json()["response"]

    return {
        "topic": request.topic,
        "ai_response": ai_text
    }

class DebateOpponentRequest(BaseModel):
    topic: str
    argument: str


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

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False
        }
    )

    response.raise_for_status()

    ai_text = response.json()["response"]

    return {
        "topic": request.topic,
        "user_argument": request.argument,
        "opponent_response": ai_text
    }

class SkillAnalysisRequest(BaseModel):
    topic: str
    argument: str


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
1. Argument Strength — give a score out of 10
2. Clarity — give a score out of 10
3. Reasoning — give a score out of 10
4. Weaknesses
5. Improvement Suggestions

At the end, calculate the overall score out of 10.

Keep the feedback constructive and easy to understand.
"""

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False
        }
    )

    response.raise_for_status()

    ai_text = response.json()["response"]

    return {
        "topic": request.topic,
        "argument": request.argument,
        "analysis": ai_text
    }

@app.post("/save-debate")
def save_debate(request: DebateOpponentRequest):

    debate = {
        "topic": request.topic,
        "argument": request.argument
    }

    result = debates_collection.insert_one(debate)

    return {
        "message": "Debate saved successfully!",
        "id": str(result.inserted_id)
    }

@app.get("/debates")
def get_debates():
    debates = list(debates_collection.find())

    for debate in debates:
        debate["_id"] = str(debate["_id"])

    return {
        "debates": debates
    }

class TopicGeneratorRequest(BaseModel):
    category: str = "General"


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

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False
        }
    )

    response.raise_for_status()

    ai_text = response.json()["response"]

    import json
    ai_data = json.loads(ai_text)
    topics = ai_data["topics"]

    return {
        "category": request.category,
        "topics": topics
    }
