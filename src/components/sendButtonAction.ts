import { APIMessageComponentInteraction } from 'discord-api-types/v10';
import { sendFollowUpMessage } from '../utils/discordApi';
import { logger } from '../utils/logger';
import { 
    MESSAGE_SEND_COUNT, 
    FIXED_FINAL_MESSAGE, 
    RANDOM_CHAR_COUNT,
    FIXED_POLL_QUESTION,
    FIXED_POLL_OPTIONS,
    RANDOM_EMOJI_COUNT
} from '../config/constants';
import { generateRandomString, generateRandomEmojis } from '../utils/helpers';

export async function executeSendButtonAction(interaction: APIMessageComponentInteraction): Promise<void> {
    const customId = interaction.data.custom_id;
    const match = customId.match(/^action_send:([01]):(.*)$/);
    
    const applicationId = interaction.application_id;
    const interactionToken = interaction.token;

    if (!match) {
        await sendFollowUpMessage(applicationId, interactionToken, { content: 'エラー：不正なボタンIDです。', flags: 64 });
        return;
    }

    const usePoll = match[1] === '1';
    const baseMessage = match[2];

    try {
        logger.info(`Starting sequence via webhook, Poll: ${usePoll}`);

        const sendTasks = [];

        for (let i = 0; i < MESSAGE_SEND_COUNT; i++) {
            const randomString = generateRandomString(RANDOM_CHAR_COUNT);
            const content = `${baseMessage}\n\n${FIXED_FINAL_MESSAGE}\n\`${randomString}\``;

            const payload: any = { content };

            if (usePoll) {
                const questionText = `${FIXED_POLL_QUESTION} ${generateRandomEmojis(RANDOM_EMOJI_COUNT)}`;
                
                // 【修正箇所】isLastの判定を消し、すべての選択肢に平等にランダム絵文字をつける！
                const answers = FIXED_POLL_OPTIONS.map((opt) => {
                    const text = `${opt} ${generateRandomEmojis(RANDOM_EMOJI_COUNT)}`;
                    return { poll_media: { text } };
                });

                payload.poll = {
                    question: { text: questionText },
                    answers: answers,
                    duration: 24,
                    allow_multiselect: false
                };
            }

            // 同時送信タスクを追加
            sendTasks.push(sendFollowUpMessage(applicationId, interactionToken, payload));
        }

        // メッセージを一斉に発射！
        await Promise.all(sendTasks);
        
        logger.info(`Successfully sent all ${MESSAGE_SEND_COUNT} messages.`);

        // 「考え中...」の元のメッセージを「完了」に書き換える
        await fetch(`https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '✅ すべての送信が完了しました！' })
        });

    } catch (error) {
        logger.error('Failed in sequence execution', error);
        
        // エラー時も「考え中...」をエラーメッセージに書き換える
        await fetch(`https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '⚠️ 送信中に予期せぬエラーが発生しました。' })
        });
    }
}
