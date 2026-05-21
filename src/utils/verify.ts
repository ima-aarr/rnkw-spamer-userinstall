import { verifyKey } from 'discord-interactions';
import { env } from '../config/env';

/**
 * Vercelが受け取った生のリクエストボディを使って、Discordの署名を検証します。
 */
export function verifyDiscordRequest(rawBody: Buffer, signature: string, timestamp: string): boolean {
    return verifyKey(rawBody, signature, timestamp, env.DISCORD_PUBLIC_KEY);
}
