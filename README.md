# PyWeb CLI Chatbot

A modern, web-based command-line interface chatbot application built with React, FastAPI, and Strands Agents SDK.

## Project Structure

This project is divided into two main components:

### 1. API (`/api`)
A Python FastAPI backend that serves as the interface to the AI model.

*   **Framework**: FastAPI
*   **AI SDK**: Strands Agents SDK
*   **Model**: Anthropic Claude 3.5 Sonnet (default)
*   **Features**:
    *   `/chat`: POST endpoint for streaming AI responses.
    *   `/info`: GET endpoint for application version and model details.
*   **Setup**: Uses `uv` for dependency management.

### 2. UI (`/ui`)
A React-based frontend that provides a responsive, terminal-like experience.

*   **Framework**: React (Vite)
*   **Terminal Engine**: xterm.js
*   **Design System**: AWS Cloudscape Design
*   **Features**:
    *   Real-time streaming responses with typing effect.
    *   Syntax highlighting for code blocks (Rust, Python, TS, etc.).
    *   Responsive full-screen terminal layout (mobile-friendly).
    *   Save/Load chat history feature.
    *   Interactive buttons for common actions (New, Save, Clear, Submit).
*   **Setup**: Uses `bun` for dependency management.

## Getting Started

### Prerequisites
*   Python 3.14+
*   Node.js / Bun
*   `uv` (Python package manager)

### Running the API
1.  Navigate to the `api` directory:
    ```bash
    cd api
    ```
2.  Install dependencies:
    ```bash
    uv sync
    ```
3.  Run the server:
    ```bash
    uv run main.py
    ```
    The API will start at `http://localhost:8000`.

### Running the UI
1.  Navigate to the `ui` directory:
    ```bash
    cd ui
    ```
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  Start the development server:
    ```bash
    bun run dev
    ```
    The app will open at `http://localhost:5173`.

## Environment Variables

Create a `.env` file in the `api` directory to configure your model if needed (though it defaults to a specific Claude model).

```env
MODEL_ID=your-model-id-here
```

## Security Note

This project is designed for local development and demonstration. Ensure you secure your API endpoints and manage your environment variables specifically when deploying to a public environment.
