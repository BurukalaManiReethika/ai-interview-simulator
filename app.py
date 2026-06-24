from flask import Flask, render_template, request
import json
import random

app = Flask(__name__)

with open("questions.json", "r") as f:
    questions = json.load(f)

@app.route("/")
def home():
    question = random.choice(questions)
    return render_template("index.html", question=question)

@app.route("/evaluate", methods=["POST"])
def evaluate():
    answer = request.form["answer"]

    if len(answer) > 100:
        score = 9
    elif len(answer) > 50:
        score = 7
    else:
        score = 5

    return render_template(
        "result.html",
        answer=answer,
        score=score
    )

if __name__ == "__main__":
    app.run(debug=True)
