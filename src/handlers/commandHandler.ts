import { APIApplicationCommandInteraction, APIInteractionResponse } from 'discord-api-types/v10';
import { executeSendButtonCommand } from '../commands/sendButtonCommand';
import { logger } from '../utils/logger';

export async function handleCommand(interaction: APIApplicationCommandInteraction): Promise<APIInteractionResponse> {
    const commandName = interaction.data.name;

    switch (commandName) {
        case 'setup_send_button': // 登録スクリプトで定義するコマンド名と一致させます
            return await executeSendButtonCommand(interaction);
            
        default:
            logger.warn(`Unknown command received: ${commandName}`);
            throw new Error(`Unknown command: ${commandName}`);
    }
}
