import os
from dotenv import load_dotenv

load_dotenv()
print(f"DEBUG: DATABASE_URL={os.getenv('DATABASE_URL')}")
print(f"DEBUG: CWD={os.getcwd()}")
print(f"DEBUG: ENV_FILES={os.listdir('.')}")
