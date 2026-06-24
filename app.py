import os
import json
import random
from flask import Flask, render_template, request, jsonify, session
from anthropic import Anthropic

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

with open("questions.json", "r") as f:
    QUESTIONS = json.load(f)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/question", methods=["POST"])
def get_question():
    data = request.json
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
    data = request.json
    question = data.get("question", "")
    answer = data.get("answer", "")
    domain = data.get("domain", "")
    difficulty = data.get("difficulty", "easy")
    time_taken = data.get("time_taken", 0)

    if not answer.strip():
        return jsonify({"error": "Answer cannot be empty"}), 400

    prompt = f"""You are a senior technical interviewer evaluating a candidate's answer.

Question: "{question}"
Domain: {domain}
Difficulty: {difficulty}
Candidate's answer: "{answer}"
Time taken: {time_taken} seconds

Evaluate the answer and respond ONLY with a JSON object (no markdown, no extra text):
{{
  "overall_score": <integer 1-10>,
  "criteria": {{
    "accuracy": <integer 1-10>,
    "depth": <integer 1-10>,
    "clarity": <integer 1-10>,
    "examples": <integer 1-10>
  }},
  "grade": "<Excellent|Good|Needs improvement|Poor>",
  "strengths": "<2-3 specific strengths of the answer>",
  "improvements": "<2-3 specific areas to improve>",
  "model_answer": "<A concise model answer in 2-3 sentences highlighting key points>"
}}"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.content[0].text.strip()
        # Strip markdown fences if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        evaluation = json.loads(raw)
        return jsonify(evaluation)
    except json.JSONDecodeError:
        return jsonify({
            "overall_score": 5,
            "criteria": {"accuracy": 5, "depth": 5, "clarity": 5, "examples": 5},
            "grade": "Good",
            "strengths": "Answer was submitted.",
            "improvements": "Try to be more specific and provide examples.",
            "model_answer": ""
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/domains", methods=["GET"])
def get_domains():
    result = {}
    for domain, difficulties in QUESTIONS.items():
        result[domain] = {
            diff: len(qs) for diff, qs in difficulties.items()
        }
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
