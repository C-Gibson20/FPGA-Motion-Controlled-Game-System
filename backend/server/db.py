import sqlite3
from config import DB_FILE

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            score INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

def update_score(username, increment=1):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT score FROM players WHERE username = ?', (username,))
    result = cursor.fetchone()
    if result:
        new_score = result[0] + increment
        cursor.execute('UPDATE players SET score = ? WHERE username = ?', (new_score, username))
    else:
        cursor.execute('INSERT INTO players (username, score) VALUES (?, ?)', (username, increment))
    conn.commit()
    conn.close()

def get_scores():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT username, score FROM players ORDER BY score DESC')
    scores = cursor.fetchall()
    conn.close()
    return scores
