from flask import Flask, jsonify, request
from db import update_score, get_scores

app = Flask(__name__)

@app.route("/scores")
def scores():
    return jsonify({"scores": get_scores()})

@app.route("/update_score", methods=["POST"])
def api_update_score():
    data = request.json
    update_score(data.get("username"), data.get("increment", 1))
    return jsonify({"message": "Score updated"})
