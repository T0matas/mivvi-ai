import { useState } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default function APITester() {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');

    const testAPI = async () => {
        setTesting(true);
        setResult('');
        setError('');

        console.log('🔑 Testing API Key:', OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 20)}...` : 'MISSING');

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Mivvi API Test',
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.1-8b-instruct:free',
                    messages: [{ role: 'user', content: 'Say "API is working!" in Portuguese' }],
                    temperature: 0.7,
                }),
            });

            console.log('📡 Response Status:', response.status, response.statusText);
            console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error Response:', errorText);
                setError(`HTTP ${response.status}: ${errorText}`);
                setTesting(false);
                return;
            }

            const data = await response.json();
            console.log('✅ Success! Response:', data);

            const content = data.choices?.[0]?.message?.content || 'No content';
            setResult(content);
        } catch (err: any) {
            console.error('❌ Fetch Error:', err);
            setError(err.message || 'Unknown error');
        }

        setTesting(false);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    🔧 OpenRouter API Tester
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    API Key: {OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 15)}...` : '❌ MISSING'}
                </Typography>

                <Button
                    variant="contained"
                    onClick={testAPI}
                    disabled={testing}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    {testing ? 'Testing...' : 'Test API Connection'}
                </Button>

                {result && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">✅ Success!</Typography>
                        <Typography variant="body2">{result}</Typography>
                    </Alert>
                )}

                {error && (
                    <Alert severity="error">
                        <Typography variant="subtitle2" fontWeight="bold">❌ Error</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {error}
                        </Typography>
                    </Alert>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Check the browser console (F12) for detailed logs
                </Typography>
            </Paper>
        </Box>
    );
}
