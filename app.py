import os
import json
import random
import urllib.request
import urllib.error
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

with open("questions.json", "r") as f:
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
        api_key_set=bool(GEMINI_API_KEY)
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

    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not set on the server"}), 500

    prompt = f"""You are a senior technical interviewer evaluating a candidate's answer.

Question: "{question}"
Domain: {domain}
Difficulty: {difficulty}
Candidate's answer: "{answer}"
Time taken: {time_taken} seconds

Evaluate the answer and respond ONLY with a valid JSON object (no markdown, no backticks, no extra text):
{{
  "overall_score": <integer 1-10>,
  "criteria": {{
    "accuracy": <integer 1-10>,
    "depth": <integer 1-10>,
    "clarity": <integer 1-10>,
    "examples": <integer 1-10>
  }},
  "grade": "<Excellent|Good|Needs improvement|Poor>",
  "strengths": "<2-3 specific strengths>",
  "improvements": "<2-3 specific areas to improve>",
  "model_answer": "<concise model answer in 2-3 sentences>"
}}"""

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1000
        }
    }).encode("utf-8")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            raw = body["candidates"][0]["content"]["parts"][0]["text"].strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            evaluation = json.loads(raw)
            return jsonify(evaluation)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return jsonify({"error": f"Gemini API error: {e.code} - {err_body}"}), 500
    except json.JSONDecodeError:
        return jsonify({
            "overall_score": 5,
            "criteria": {"accuracy": 5, "depth": 5, "clarity": 5, "examples": 5},
            "grade": "Good",
            "strengths": "Answer submitted successfully.",
            "improvements": "Try to be more specific and include examples.",
            "model_answer": ""
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
