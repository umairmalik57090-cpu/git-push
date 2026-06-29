# UniAssist AI Student Helpdesk

## Project Structure
- `app.py` — Flask web application
- `requirements.txt` — Python dependencies
- `templates/index.html` — main UI template
- `static/css/styles.css` — styling
- `static/js/script.js` — frontend application logic
- `static/data/intents.json` — local chatbot knowledge base

## Run Locally
1. Open a terminal in `d:\Intership Chatboat developer`
2. Activate the virtual environment if needed:
   - `.\.venv\Scripts\Activate.ps1`
3. Install dependencies if not already installed:
   - `python -m pip install -r requirements.txt`
4. Start the app:
   - `python app.py`
5. Open the browser at:
   - `http://127.0.0.1:5000`

## Notes
- The app uses local JSON data from `static/data/intents.json`.
- If the loading screen still appears, open the browser console and verify the fetch URL is `http://127.0.0.1:5000/static/data/intents.json`.
- This is a Flask development server, suitable for local testing.
