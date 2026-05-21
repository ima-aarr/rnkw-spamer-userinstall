import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyKey } from 'discord-interactions';
import { InteractionType, InteractionResponseType } from 'discord-api-types/v10';
import { env } from '../src/config/env';
import { handleComponent } from '../src/handlers/componentHandler';
import { executeSendButtonCommand } from '../src/commands/sendButtonCommand';

export const config = {
    api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');

    const signature = req.headers['x-signature-ed25519'] as string;
    const timestamp = req.headers['x-signature-timestamp'] as string;

    if (!signature || !timestamp) return res.status(401).send('Missing signature headers');

    const isValidRequest = verifyKey(rawBody, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    if (!isValidRequest) return res.status(401).send('Bad request signature');

    const interaction = JSON.parse(rawBody);

    try {
        if (interaction.type === InteractionType.Ping) {
            return res.status(200).json({ type: InteractionResponseType.Pong });
        }

        if (interaction.type === InteractionType.ApplicationCommand) {
            if (interaction.data.name === 'setup_send_button') {
                const responsePayload = await executeSendButtonCommand(interaction);
                return res.status(200).json(responsePayload);
            }
        }

        if (interaction.type === InteractionType.MessageComponent) {
            // 【大変更点①】Vercelのres.jsonを使わず、DiscordのAPIを直接叩いて「考え中...」にする
            await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 5, // 考え中
                    data: { flags: 64 } // 自分だけに表示
                })
            });

            // 【大変更点②】Vercelが起きている間に、すべてのメッセージ送信処理を終わらせる
            try {
                await handleComponent(interaction);
            } catch (error) {
                console.error('Error in component task:', error);
            }
            
            // 【大変更点③】全部終わったら、ここで初めてVercelの通信を終了する
            return res.status(200).end();
        }

        return res.status(400).send('Unknown interaction type');
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (!res.headersSent) {
            return res.status(500).send('Internal Server Error');
        }
    }
}
