from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from strands import Agent
from strands.models import BedrockModel
from dotenv import load_dotenv
import uvicorn
import os

load_dotenv()

APP_VERSION = "1.0.0"
DEFAULT_MODEL_ID = os.getenv("DEFAULT_MODEL_ID", "us.anthropic.claude-sonnet-4-5-20250929-v1:0")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str
    model_id: str = DEFAULT_MODEL_ID

@app.get("/info")
async def info_endpoint():
    return {
        "app_version": APP_VERSION,
        "model_id": os.getenv("MODEL_ID", DEFAULT_MODEL_ID)
    }

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # Initialize the model
    model = BedrockModel(model_id=request.model_id)
    
    # Initialize the agent
    agent = Agent(model=model)
    
    # Streaming response generator
    async def generate():
        async for chunk in agent.stream_async(request.prompt):
            if isinstance(chunk, dict) and "data" in chunk:
                yield chunk["data"]
            elif isinstance(chunk, str):
                yield chunk
            elif hasattr(chunk, "text"):
                yield chunk.text

    return StreamingResponse(generate(), media_type="text/plain")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
