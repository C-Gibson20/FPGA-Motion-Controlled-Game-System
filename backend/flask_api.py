from flask import Flask, jsonify, request
import sqlite3

app = Flask(__name__)
DB_FILE = "game_data.db"

def get_scores():
    """Retrieve all player scores from the database."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT username, score FROM players ORDER BY score DESC')
    scores = [{"username": row[0], "score": row[1]} for row in cursor.fetchall()]
    conn.close()
    return scores

@app.route('/scores', methods=['GET'])
def fetch_scores():
    """API endpoint to get all player scores."""
    scores = get_scores()
    return jsonify({"scores": scores})

@app.route('/update_score', methods=['POST'])
def update_score():
    """API endpoint to update a player's score."""
    data = request.json
    username = data.get("username")
    increment = data.get("increment", 1)

    if not username:
        return jsonify({"error": "Username is required"}), 400

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT score FROM players WHERE username = ?', (username,))
    result = cursor.fetchone()

    if result:
        new_score = result[0] + increment
        cursor.execute('UPDATE players SET score = ? WHERE username = ?', (new_score, username))
    else:
        new_score = increment
        cursor.execute('INSERT INTO players (username, score) VALUES (?, ?)', (username, new_score))

    conn.commit()
    conn.close()

    return jsonify({"message": "Score updated", "username": username, "new_score": new_score})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
