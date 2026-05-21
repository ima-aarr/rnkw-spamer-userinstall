import { 
    APIApplicationCommandInteraction, 
    APIInteractionResponse, 
    InteractionResponseType, 
    MessageFlags,
    ComponentType,
    ButtonStyle,
    APIApplicationCommandInteractionDataStringOption,
    APIApplicationCommandInteractionDataBooleanOption
} from 'discord-api-types/v10';
import { logger } from '../utils/logger';

export async function executeSendButtonCommand(interaction: APIApplicationCommandInteraction): Promise<APIInteractionResponse> {
    let targetMessage = 'https://shb.red/s/DO7Pfx';
    let usePoll = false;
    
    if (interaction.data && 'options' in interaction.data && interaction.data.options) {
        const messageOption = interaction.data.options.find(
            (opt): opt is APIApplicationCommandInteractionDataStringOption => opt.name === 'message'
        );
        if (messageOption && messageOption.value) {
            targetMessage = messageOption.value;
        }

        const pollOption = interaction.data.options.find(
            (opt): opt is APIApplicationCommandInteractionDataBooleanOption => opt.name === 'use_poll'
        );
        if (pollOption && pollOption.value !== undefined) {
            usePoll = pollOption.value;
        }
    }

    // custom_id に pollのフラグとメッセージを格納 (例: action_send:1:こんにちは)
    const pollFlag = usePoll ? '1' : '0';
    const customIdPrefix = `action_send:${pollFlag}:`;
    
    // Discordの制限(100文字)に収まるように切り詰め
    const maxMessageLength = 100 - customIdPrefix.length;
    if (targetMessage.length > maxMessageLength) {
        targetMessage = targetMessage.substring(0, maxMessageLength);
        logger.warn(`User message was truncated: ${targetMessage}`);
    }

    const customId = `${customIdPrefix}${targetMessage}`;

    return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: '以下のボタンを押すと、設定したメッセージが送信されます。',
            flags: MessageFlags.Ephemeral,
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Danger,
                            custom_id: customId,
                            label: '送信',
                        }
                    ]
                }
            ]
        }
    };
}
