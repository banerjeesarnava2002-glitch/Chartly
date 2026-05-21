import sqlite3
conn = sqlite3.connect('playground.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables:', cur.fetchall())
try:
    cur.execute('SELECT id, filename, row_count FROM datasets LIMIT 10')
    print('Datasets in DB:', cur.fetchall())
except Exception as e:
    print('Error reading datasets:', e)
try:
    cur.execute('SELECT id, dataset_id, operation_type FROM analysis_history ORDER BY id DESC LIMIT 5')
    print('Analysis history:', cur.fetchall())
except Exception as e:
    print('Error reading history:', e)
conn.close()
