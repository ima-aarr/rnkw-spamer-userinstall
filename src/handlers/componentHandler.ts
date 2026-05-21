import { APIMessageComponentInteraction, APIInteractionResponse } from 'discord-api-types/v10';
import { executeSendButtonAction } from '../components/sendButtonAction';
import { logger } from '../utils/logger';

export async function handleComponent(interaction: APIMessageComponentInteraction): Promise<APIInteractionResponse> {
    const customId = interaction.data.custom_id;

    // 前方一致を新しいプレフィックスに変更
    if (customId.startsWith('action_send:')) {
        return await executeSendButtonAction(interaction);
    }

    logger.warn(`Unknown component action received: ${customId}`);
    throw new Error(`Unknown component custom_id: ${customId}`);
}
