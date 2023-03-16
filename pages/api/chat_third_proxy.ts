import type { NextApiRequest, NextApiResponse } from 'next';

import { Readable } from 'stream';

import { ChatGPTAPI } from 'chatgpt';

const apiKey = process.env.API_KEY;

const gptApi = new ChatGPTAPI({
    apiKey: apiKey,
    completionParams: {
        temperature: 0.5,
        top_p: 0.8,
        stream: true,
    },
});

let parentMessageId: any = null;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const postData = JSON.parse(req.body) as any;

    try {
        console.log(
            '进入代理了',
            postData.message,
            '对话id--',
            parentMessageId
        );
        let proxyRes: any;
        if (parentMessageId !== null) {
            console.log('有对话id--');
            proxyRes = await gptApi.sendMessage(postData.message, {
                parentMessageId: parentMessageId,
            });
        } else {
            console.log('无对话id--');
            proxyRes = await gptApi.sendMessage(postData.message);
        }
        console.log('得到了响应--proxyRes--', proxyRes);
        parentMessageId = proxyRes.id;

        const textArray = (proxyRes.text || 'some error is happen').split(''); // 将文本拆分为单个字符的数组
        let currentIndex = 0; // 当前字符的下标

        // proxyRes.text
        const readable = new Readable({
            read() {
                if (currentIndex < textArray.length) {
                    this.push(textArray[currentIndex]); // 将当前字符推送到可读流
                    currentIndex++;
                } else {
                    this.push(null); // 当所有字符都被推送完毕后，关闭可读流
                }
            },
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        readable.pipe(res);

        // res.status(200).write(proxyRes.text);
    } catch (error) {
        console.log('出错了--', error);
        res.status(500).write('服务器错误');
    }
}
