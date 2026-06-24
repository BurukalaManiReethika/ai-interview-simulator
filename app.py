import os
import json
import random
from flask import Flask, render_template, request, jsonify
from groq import Groq

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")

# Groq API
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)

# Load questions
with open("questions.json", "r", encoding="utf-8") as f:
    QUESTIONS = json.load(f)


@app.route("/")
def home():
    domains_summary = {
        domain: {diff: len(qs) for diff, qs in diffs.items()}
        for domain, diffs in QUESTIONS.items()
    }

    return render_template(
        "index.html",
        domains_json=json.dumps(domains_summary),
        api_key_set=bool(GROQ_API_KEY)
    )


@app.route("/api/question", methods=["POST"])
def get_question():
    data = request.json or {}

    domain = data.get("domain", "Python")
    difficulty = data.get("difficulty", "easy")

    pool = QUESTIONS.get(domain, {}).get(difficulty, [])

    if not pool:
        return jsonify({"error": "No questions found"}), 404

    question = random.choice(pool)

    return jsonify({
        "question": question["q"],
        "tip": question["tip"],
        "domain": domain,
        "difficulty": difficulty
    })


@app.route("/api/evaluate", methods=["POST"])
def evaluate():
    data = request.json or {}

    question = data.get("question", "")
    answer = data.get("answer", "")
    domain = data.get("domain", "")
    difficulty = data.get("difficulty", "easy")
    time_taken = data.get("time_taken", 0)

    if not answer.strip():
        return jsonify({"error": "Answer cannot be empty"}), 400

    if not GROQ_API_KEY:
        return jsonify({"error": "GROQ_API_KEY is not set on the server"}), 500

    prompt = f"""
You are a senior technical interviewer.

Question: {question}
Domain: {domain}
Difficulty: {difficulty}
Candidate Answer: {answer}
Time Taken: {time_taken} seconds

Evaluate the answer and return ONLY valid JSON in this format:

{{
  "overall_score": 8,
  "criteria": {{
    "accuracy": 8,
    "depth": 7,
    "clarity": 9,
    "examples": 6
  }},
  "grade": "Good",
  "strengths": "Mention 2-3 strengths.",
  "improvements": "Mention 2-3 improvements.",
  "model_answer": "Provide a concise ideal answer."
}}
"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        response_text = completion.choices[0].message.content
        evaluation = json.loads(response_text)

        return jsonify(evaluation)

    except json.JSONDecodeError:
        return jsonify({
            "overall_score": 5,
            "criteria": {
                "accuracy": 5,
                "depth": 5,
                "clarity": 5,
                "examples": 5
            },
            "grade": "Good",
            "strengths": "Answer submitted successfully.",
            "improvements": "Include more details and examples.",
            "model_answer": ""
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "groq_api_configured": bool(GROQ_API_KEY)
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
