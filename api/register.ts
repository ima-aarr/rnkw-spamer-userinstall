import { VercelRequest, VercelResponse } from '@vercel/node';
import { env } from '../src/config/env';
import { DISCORD_API_BASE_URL } from '../src/config/constants';
import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord-api-types/v10';

// 登録したいコマンドの定義（/setup_send_button）
const COMMANDS = [
    {
        name: 'setup_send_button',
        description: '自分だけに見えるメッセージ送信ボタンを設置します',
        type: ApplicationCommandType.ChatInput,
        
        // 【追加】ここがユーザーインストール対応のキモです！
        integration_types: [
            0, // GUILD_INSTALL (サーバー用)
            1  // USER_INSTALL (ユーザー個人用)
        ],
        contexts: [
            0, // GUILD (サーバー内で使える)
            1, // BOT_DM (Botとの直接のDMで使える)
            2  // PRIVATE_CHANNEL (個人間のDMやグループチャットで使える)
        ],

        options: [
            {
                name: 'message',
                description: 'ボタンを押したときに送信するメインメッセージ',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'use_poll',
                description: '一緒にアンケートを送信するかどうか',
                type: ApplicationCommandOptionType.Boolean,
                required: false,
            }
        ]
    }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed. Please use GET request (visit in browser).');
    }

    const url = `${DISCORD_API_BASE_URL}/applications/${env.DISCORD_APP_ID}/commands`;

    try {
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
            return res.status(response.status).send(`❌ Discordへのコマンド登録に失敗しました: ${response.status} - ${text}`);
        }

        const data = await response.json();
        
        return res.status(200).json({
            status: "success",
            message: "✅ スラッシュコマンドの登録・更新が完了しました！(ユーザーインストール対応版)",
            registered_commands: data
        });

    } catch (error) {
        console.error('Error registering commands:', error);
        return res.status(500).send('❌ 内部エラーが発生しました。Vercelのログを確認してください。');
    }
}
