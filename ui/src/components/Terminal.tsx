import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 15,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
      },
    });

    // Add fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    
    // Fit terminal to container
    fitAddon.fit();

    term.writeln('🤖  Web Based AI Terminal');
    term.writeln('');
    term.write('$ ');

    term.onData((data) => {
      term.write(data);
    });

    // Resize handler
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    xtermRef.current = term;

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
      }} 
    />
  );
};

export default Terminal;
