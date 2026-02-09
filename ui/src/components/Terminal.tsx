
import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import axios from 'axios';
import '@xterm/xterm/css/xterm.css';

interface ChatRequest {
  prompt: string;
  model_id?: string;
}

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const inputBuffer = useRef<string>('');
  const isProcessing = useRef<boolean>(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 15,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
      },
      convertEol: true, // Treat \n as \r\n
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // Initial prompt
    term.writeln('Welcome to the AI Terminal');
    term.write('\r\n👤 ');

    // Handle resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    xtermRef.current = term;

    const handleCommand = async (prompt: string) => {
      isProcessing.current = true;
      term.write('\n🤖  ');

      try {
        let lastProcessedIndex = 0;

        const payload: ChatRequest = {
          prompt: prompt,
          model_id: "anthropic.claude-3-5-sonnet-20240620-v1:0"
        };

        await axios.post('http://localhost:8000/chat', payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'text',
          onDownloadProgress: (progressEvent) => {
            const xhr = progressEvent.event.target as XMLHttpRequest;
            const response = xhr.response;
            const newContent = response.substring(lastProcessedIndex);
            if (newContent) {
              term.write(newContent.replace(/\n/g, '\r\n'));
              lastProcessedIndex = response.length;
            }
          },
        });

      } catch (error) {
        term.write(`\r\nError: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        isProcessing.current = false;
        term.write('\r\n\r\n👤 ');
      }
    };

    // Handle user input
    term.onData(async (data) => {
      // If we are waiting for AI response, ignore input
      if (isProcessing.current) return;

      const code = data.charCodeAt(0);

      // Handle Enter (13)
      if (code === 13) {
        const prompt = inputBuffer.current.trim();
        term.write('\r\n'); // Move to next line
        inputBuffer.current = '';

        if (prompt) {
          await handleCommand(prompt);
        } else {
          // Empty prompt, just show user prompt again
          term.write('👤  ');
        }
        return;
      }

      // Handle Backspace (127)
      if (code === 127) {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write('\b \b'); // Move back, print space to erase, move back again
        }
        return;
      }

      // Handle printable characters (ignore control chars mostly)
      if (code >= 32) {
        inputBuffer.current += data;
        term.write(data);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '85vh',
        backgroundColor: '#1e1e1e' // Match terminal background
      }}
    />
  );
};

export default Terminal;
