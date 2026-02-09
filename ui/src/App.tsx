import { Box, Typography } from '@mui/material';
import Terminal from '@/components/Terminal';
import TerminalIcon from '@mui/icons-material/Terminal';

function App() {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 0.5,
              borderRadius: 1,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TerminalIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: '-0.01em' }}>
            PyWeb <Box component="span" sx={{ color: 'primary.main' }}>CLI</Box>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            v1.0.0
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Terminal />
      </Box>
    </Box>
  );
}

export default App;
