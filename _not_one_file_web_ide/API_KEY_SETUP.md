# API Key Setup

## How to Set Up Your Gemini API Key

### Option 1: Environment Variable (Recommended)

1. Create a `.env` file in the project root:
   ```bash
   touch .env
   ```

2. Add your API key to the `.env` file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Get your API key from: https://makersuite.google.com/app/apikey

### Option 2: Direct Configuration

If you prefer not to use environment variables, you can modify the service directly:

1. Open `services/geminiService.ts`
2. Replace `"YOUR_API_KEY_HERE"` with your actual API key
3. **Note**: This is less secure as the key will be visible in your code

### Option 3: Configuration File

1. Copy `config.example.js` to `config.js`
2. Replace `'your_actual_api_key_here'` with your actual API key
3. Import and use the config in your service

## Security Notes

- Never commit your actual API key to version control
- The `.env` file is already included in `.gitignore`
- Use environment variables in production deployments
- Consider using a secrets management service for production

## Testing

After setting up your API key, restart the development server:

```bash
npm run dev
```

The application should now be able to connect to the Gemini API.
