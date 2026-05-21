import { env } from '../config/env';
import { DISCORD_API_BASE_URL } from '../config/constants';
import { logger } from './logger';
import { sleep } from './helpers';

/**
 * インタラクショントークンを使用してフォローアップメッセージを送信します（ユーザーアプリ対応）
 * Rate Limit (429) を受けた場合は、自動的に待機して再試行します。
 */
export async function sendFollowUpMessage(applicationId: string, interactionToken: string, payload: any, retryCount = 0): Promise<void> {
    // ユーザーアプリとしてどこでも送信できるように、チャンネル指定ではなくWebhook(Follow-up)を使用します
    const url = `${DISCORD_API_BASE_URL}/webhooks/${applicationId}/${interactionToken}`;
    const MAX_RETRIES = 3;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                // Follow-up APIではBotトークンでの認証は不要です
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // 429 Too Many Requests (Rate Limit) の処理
        if (response.status === 429) {
            if (retryCount >= MAX_RETRIES) {
                throw new Error('Max retries exceeded for rate limit.');
            }
            
            const errorData = (await response.json()) as { retry_after: number };
            const waitTime = (errorData.retry_after * 1000) + 100; 
            logger.warn(`Rate limited! Waiting for ${waitTime}ms before retrying... (Attempt ${retryCount + 1})`);
            
            await sleep(waitTime);
            return await sendFollowUpMessage(applicationId, interactionToken, payload, retryCount + 1);
        }

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP Error: ${response.status} - ${errorBody}`);
        }
    } catch (error) {
        logger.error(`Failed to send follow-up message`, error);
        throw error; // 上位にエラーを伝播させる
    }
}
