
import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import axios from 'axios';
import { highlightCodeToAnsi } from '@/utils/highlight';
import '@xterm/xterm/css/xterm.css';
import {
  Button,
  Modal,
  SpaceBetween,
  Input,
  Box,
  FormField
} from "@cloudscape-design/components";

interface ChatRequest {
  prompt: string;
  model_id?: string;
}

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const inputBuffer = useRef<string>('');
  const isProcessing = useRef<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Move handleCommand out of useEffect to be accessible by buttons
  const handleCommand = async (prompt: string) => {
    const term = xtermRef.current;
    if (!term) return;

    isProcessing.current = true;
    term.write('\n🤖  ');

    let lineBuffer = '';
    let inCodeBlock = false;
    let currentLanguage = '';
    let lastResponseLength = 0;

    try {
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
          const fullResponse = xhr.response;
          const newChunk = fullResponse.substring(lastResponseLength);
          lastResponseLength = fullResponse.length;

          if (!newChunk) return;

          lineBuffer += newChunk;

          // Process lines
          let newlineIndex;
          while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
            const line = lineBuffer.substring(0, newlineIndex);
            lineBuffer = lineBuffer.substring(newlineIndex + 1);

            // Check for code block toggles
            if (line.trim().startsWith('```')) {
              if (inCodeBlock) {
                inCodeBlock = false;
                currentLanguage = '';
                term.writeln(line); // End block
              } else {
                inCodeBlock = true;
                currentLanguage = line.trim().slice(3).trim();
                term.writeln(line); // Start block
              }
            } else {
              if (inCodeBlock) {
                // Highlight line
                const highlighted = highlightCodeToAnsi(line, currentLanguage);
                term.writeln(highlighted);
              } else {
                term.writeln(line);
              }
            }
          }
        },
      });

      // Process remaining buffer (last line without newline)
      if (lineBuffer) {
        if (inCodeBlock) {
          const highlighted = highlightCodeToAnsi(lineBuffer, currentLanguage);
          term.write(highlighted);
        } else {
          term.write(lineBuffer);
        }
      }

    } catch (error) {
      term.write(`\r\nError: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isProcessing.current = false;
      term.write('\r\n\r\n👤  ');
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const isMobile = window.innerWidth < 768;
    const fontSize = isMobile ? 13 : 15; // Smaller font on mobile

    const term = new XTerm({
      cursorBlink: true,
      fontSize: fontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      letterSpacing: isMobile ? 0 : 0, // Adjust spacing if needed
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#e5c07b',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      // Helper options for mobile scrolling/flow
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Initial fit
    setTimeout(() => fitAddon.fit(), 0); // Timeout to ensure layout is ready

    // Initial prompt
    term.writeln('Welcome to the AI Terminal');
    term.write('\r\n👤  ');

    // Handle resize
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      term.options.fontSize = isMobile ? 12 : 15;
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    xtermRef.current = term;

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

  const handleNew = () => {
    if (xtermRef.current) {
      xtermRef.current.reset();
      xtermRef.current.writeln('Welcome to the AI Terminal');
      xtermRef.current.write('\r\n👤  ');
      inputBuffer.current = '';
      isProcessing.current = false;
      xtermRef.current.focus();
    }
  };

  const handleSaveOpen = () => {
    setIsModalOpen(true);
    setSaveName("");
  };

  const handleSaveConfirm = () => {
    if (!xtermRef.current || !saveName.trim()) return;

    // Capture terminal content
    const buffer = xtermRef.current.buffer.active;
    const lines: string[] = [];
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) {
        lines.push(line.translateToString(true));
      }
    }
    const content = lines.join('\n').trim();

    // Save to local storage
    if (content) {
      localStorage.setItem(`chat_${saveName}`, content);
      // Maybe show specific feedback? For now, close modal.
    }
    setIsModalOpen(false);
    // Refocus terminal
    xtermRef.current.focus();
  };

  const handleClearInput = () => {
    if (xtermRef.current && inputBuffer.current.length > 0) {
      const len = inputBuffer.current.length;
      // Erase characters visually
      for (let i = 0; i < len; i++) {
        xtermRef.current.write('\b \b');
      }
      inputBuffer.current = '';
      xtermRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    if (xtermRef.current && inputBuffer.current.trim() && !isProcessing.current) {
      const prompt = inputBuffer.current.trim();
      xtermRef.current.write('\r\n');
      inputBuffer.current = '';
      await handleCommand(prompt);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={terminalRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#1e1e1e',
          overflow: 'hidden'
        }}
      />

      {/* Top Right Controls */}
      <div style={{ position: 'absolute', top: 10, right: 30, zIndex: 10 }}>
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={handleNew} variant="primary">new</Button>
          <Button onClick={handleSaveOpen} variant="primary">save</Button>
        </SpaceBetween>
      </div>

      {/* Bottom Right Controls */}
      <div style={{ position: 'absolute', bottom: 40, right: 30, zIndex: 10 }}>
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={handleClearInput} variant="primary">clear</Button>
          <Button onClick={handleSubmit} variant="primary">submit</Button>
        </SpaceBetween>
      </div>

      <Modal
        onDismiss={() => setIsModalOpen(false)}
        visible={isModalOpen}
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveConfirm}>Save</Button>
            </SpaceBetween>
          </Box>
        }
        header="Save Chat"
      >
        <FormField label="Chat Name">
          <Input
            value={saveName}
            onChange={({ detail }) => setSaveName(detail.value)}
            placeholder="Enter a name for this session"
          />
        </FormField>
      </Modal>
    </div>
  );
};

export default Terminal;
