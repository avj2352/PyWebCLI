from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from strands import Agent
from strands.models import BedrockModel
from dotenv import load_dotenv
import uvicorn
import os

load_dotenv()

app = FastAPI()

class ChatRequest(BaseModel):
    prompt: str
    model_id: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"

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
