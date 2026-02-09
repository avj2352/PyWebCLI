
import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import axios from 'axios';
import { highlightCodeToAnsi } from '@/utils/highlight';
import '@xterm/xterm/css/xterm.css';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack
} from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

interface ChatRequest {
  prompt: string;
  model_id?: string;
}

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const inputBuffer = useRef<string>('');
  const isProcessing = useRef<boolean>(false);
  const spinnerInterval = useRef<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [hasAiResponse, setHasAiResponse] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);

  const handleCommand = async (prompt: string) => {
    const term = xtermRef.current;
    if (!term) return;

    isProcessing.current = true;
    term.write('\n🤖  ');

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;

    term.write(frames[0]);
    spinnerInterval.current = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      term.write('\b' + frames[frameIndex]);
    }, 80);

    const stopSpinner = () => {
      if (spinnerInterval.current) {
        clearInterval(spinnerInterval.current);
        spinnerInterval.current = null;
        term.write('\b \b');
      }
    };

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
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
        responseType: 'text',
        onDownloadProgress: (progressEvent) => {
          stopSpinner();
          setHasAiResponse(true);

          const xhr = progressEvent.event.target as XMLHttpRequest;
          const fullResponse = xhr.response;
          const newChunk = fullResponse.substring(lastResponseLength);
          lastResponseLength = fullResponse.length;

          if (!newChunk) return;

          lineBuffer += newChunk;

          let newlineIndex;
          while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
            const line = lineBuffer.substring(0, newlineIndex);
            lineBuffer = lineBuffer.substring(newlineIndex + 1);

            if (line.trim().startsWith('```')) {
              if (inCodeBlock) {
                inCodeBlock = false;
                currentLanguage = '';
                term.writeln(line);
              } else {
                inCodeBlock = true;
                currentLanguage = line.trim().slice(3).trim();
                term.writeln(line);
              }
            } else {
              if (inCodeBlock) {
                const highlighted = highlightCodeToAnsi(line, currentLanguage);
                term.writeln(highlighted);
              } else {
                term.writeln(line);
              }
            }
          }
        },
      });

      if (lineBuffer) {
        if (inCodeBlock) {
          const highlighted = highlightCodeToAnsi(lineBuffer, currentLanguage);
          term.write(highlighted);
        } else {
          term.write(lineBuffer);
        }
      }

    } catch (error) {
      stopSpinner();
      let errorMessage = "An unknown error occurred.";

      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          errorMessage = "Network Error: Unable to connect to the server.";
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = "Connection Timed Out.";
        } else if (error.response) {
          errorMessage = `API Error: ${error.response.status}`;
        } else {
          errorMessage = `Request Error: ${error.message}`;
        }
      } else {
        errorMessage = error instanceof Error ? error.message : String(error);
      }
      term.write(`\r\n\x1b[31m${errorMessage}\x1b[0m`);
    } finally {
      stopSpinner();
      isProcessing.current = false;
      term.write('\r\n\r\n👤  ');
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const isMobile = window.innerWidth < 768;
    const fontSize = isMobile ? 13 : 15;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: fontSize,
      fontFamily: '"JetBrains Mono", "Fira Code", "Menlo", "Monaco", monospace',
      theme: {
        background: '#1e293b', // Match background.paper
        foreground: '#e2e8f0',
        cursor: '#6366f1',
        selectionBackground: 'rgba(99, 102, 241, 0.3)',
        black: '#0f172a',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#f8fafc',
      },
      convertEol: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    setTimeout(() => fitAddon.fit(), 0);

    const initTerminal = async () => {
      try {
        term.writeln('Connecting to server...');
        const response = await axios.get('http://localhost:8000/info');
        const { app_version, model_id } = response.data;

        term.write('\x1b[2K\r');

        const cyan = '\x1b[96m';
        const magenta = '\x1b[95m';
        const yellow = '\x1b[93m';
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';

        const vLabel = "App Version: ";
        const mLabel = "Model ID:    ";

        const innerWidth = term.cols - 2;
        const horizontal = "─".repeat(innerWidth);

        term.writeln(`${cyan}┌${horizontal}┐${reset}`);
        term.writeln(`${cyan}│${bold}${yellow} ${vLabel}${reset}${app_version}${" ".repeat(Math.max(0, innerWidth - (vLabel.length + app_version.length + 1)))}${cyan}│${reset}`);
        term.writeln(`${cyan}│${bold}${magenta} ${mLabel}${reset}${model_id}${" ".repeat(Math.max(0, innerWidth - (mLabel.length + model_id.length + 1)))}${cyan}│${reset}`);
        term.writeln(`${cyan}└${horizontal}┘${reset}`);
        term.writeln('');

      } catch (error) {
        term.writeln('\x1b[31mFailed to fetch server info.\x1b[0m');
      }

      term.writeln('Welcome to the AI Terminal');
      term.write('\r\n👤  ');
    };

    initTerminal();

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      term.options.fontSize = isMobile ? 12 : 15;
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    xtermRef.current = term;

    term.onData(async (data) => {
      if (isProcessing.current) return;
      const code = data.charCodeAt(0);

      if (code === 13) {
        const prompt = inputBuffer.current.trim();
        term.write('\r\n');
        inputBuffer.current = '';
        setHasUserInput(false);

        if (prompt) {
          await handleCommand(prompt);
        } else {
          term.write('👤  ');
        }
        return;
      }

      if (code === 127) {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write('\b \b');
          if (inputBuffer.current.length === 0) setHasUserInput(false);
        }
        return;
      }

      if (code >= 32) {
        inputBuffer.current += data;
        term.write(data);
        setHasUserInput(true);
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
      setHasAiResponse(false);
      setHasUserInput(false);
    }
  };

  const handleSaveOpen = () => {
    setIsModalOpen(true);
    setSaveName("");
  };

  const handleSaveConfirm = () => {
    if (!xtermRef.current || !saveName.trim()) return;
    const buffer = xtermRef.current.buffer.active;
    const lines: string[] = [];
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) lines.push(line.translateToString(true));
    }
    const content = lines.join('\n').trim();
    if (content) localStorage.setItem(`chat_${saveName}`, content);
    setIsModalOpen(false);
    xtermRef.current.focus();
  };

  const handleClearInput = () => {
    if (xtermRef.current && inputBuffer.current.length > 0) {
      const len = inputBuffer.current.length;
      for (let i = 0; i < len; i++) xtermRef.current.write('\b \b');
      inputBuffer.current = '';
      xtermRef.current.focus();
      setHasUserInput(false);
    }
  };

  const handleSubmit = async () => {
    if (xtermRef.current && inputBuffer.current.trim() && !isProcessing.current) {
      const prompt = inputBuffer.current.trim();
      xtermRef.current.write('\r\n');
      inputBuffer.current = '';
      setHasUserInput(false);
      await handleCommand(prompt);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b' }}>
      {/* Top Controls Overlay */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="New Chat">
            <IconButton
              size="small"
              onClick={handleNew}
              disabled={!hasAiResponse}
              sx={{
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                color: 'primary.main',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' },
                '&.Mui-disabled': { bgcolor: 'transparent', color: 'action.disabled', border: 'none' }
              }}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save Session">
            <IconButton
              size="small"
              onClick={handleSaveOpen}
              disabled={!hasAiResponse}
              sx={{
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                color: 'primary.main',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' },
                '&.Mui-disabled': { bgcolor: 'transparent', color: 'action.disabled', border: 'none' }
              }}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Box
        ref={terminalRef}
        sx={{
          flexGrow: 1,
          width: '100%',
          overflow: 'hidden',
          minHeight: 0,
          p: 1.5,
          pb: 6, // Padding to push prompt up slightly so it's visible 'through' the transparent footer
          '& .xterm-viewport': {
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' },
          }
        }}
      />

      {/* Bottom Controls Overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          p: 1,
          px: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          pointerEvents: 'none'
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ pointerEvents: 'auto' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteOutlineIcon />}
            onClick={handleClearInput}
            disabled={!hasUserInput}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.secondary',
              bgcolor: 'rgba(30, 41, 59, 0.4)', // Subtle semi-transparent background for buttons
              backdropFilter: 'blur(4px)',
              px: 2
            }}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            size="small"
            endIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={!hasUserInput}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              boxShadow: 'none',
              px: 2
            }}
          >
            Submit
          </Button>
        </Stack>
      </Box>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Save Chat Session</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a name to save this terminal session to your local storage.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Session Name"
            fullWidth
            variant="outlined"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="e.g. data-analysis-session"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsModalOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleSaveConfirm}
            variant="contained"
            disabled={!saveName.trim()}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Save Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Terminal;
