import { env } from '../src/config/env';
import { DISCORD_API_BASE_URL } from '../src/config/constants';
import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord-api-types/v10';

const COMMANDS = [
    {
        name: 'setup_send_button',
        description: '自分だけに見えるメッセージ送信ボタンを設置します',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'message',
                description: 'ボタンを押したときにみんなに向けて送信するメッセージ',
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ]
    }
];

async function registerCommands() {
    const url = `${DISCORD_API_BASE_URL}/applications/${env.DISCORD_APP_ID}/commands`;

    try {
        console.log('Started refreshing application (/) commands.');

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(COMMANDS),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to register commands: ${response.status} - ${text}`);
        }

        const data = await response.json();
        console.log('Successfully reloaded application (/) commands.', data);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

registerCommands();
