import uvicorn
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
