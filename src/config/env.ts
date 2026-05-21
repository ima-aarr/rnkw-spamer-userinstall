import dotenv from 'dotenv';

// 開発環境などで .env ファイルがあれば読み込む
dotenv.config();

interface EnvironmentVariables {
    DISCORD_PUBLIC_KEY: string;
    DISCORD_APP_ID: string;
    DISCORD_BOT_TOKEN: string;
}

function getEnv(): EnvironmentVariables {
    const { DISCORD_PUBLIC_KEY, DISCORD_APP_ID, DISCORD_BOT_TOKEN } = process.env;

    if (!DISCORD_PUBLIC_KEY || !DISCORD_APP_ID || !DISCORD_BOT_TOKEN) {
        throw new Error('Missing critical environment variables. Please check your .env file or Vercel settings.');
    }

    return {
        DISCORD_PUBLIC_KEY,
        DISCORD_APP_ID,
        DISCORD_BOT_TOKEN,
    };
}

export const env = getEnv();
