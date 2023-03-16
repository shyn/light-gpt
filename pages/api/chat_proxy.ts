import { createProxyMiddleware } from 'http-proxy-middleware';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Request, Response, NextFunction } from 'express';

const apiKey = process.env.API_KEY;

const apiProxy = createProxyMiddleware({
    target: 'https://api.openai.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api/chat_proxy': `/v1/chat/completions`,
    },
    onProxyReq(proxyReq, req, res) {
        console.log('原始请求--', req.body, apiKey);
        const requestBody = req.body;
        const requestBodyJson = JSON.stringify(requestBody);
        console.log('解析出来的请求体--', requestBodyJson);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Authorization', `Bearer ${apiKey}'`);

        proxyReq.write(requestBodyJson);

        proxyReq.end();
    },
    onProxyRes(proxyRes, req, res) {
        // 将代理响应流转发到客户端
        proxyRes.on('data', (chunk) => {
            console.log('数据--', chunk);
            res.write(chunk);
        });

        proxyRes.on('end', () => {
            res.end();
        });
    },
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const expressReq = req as unknown as Request;
    const expressRes = res as unknown as Response;

    console.log('使用代理服务器--');

    return apiProxy(expressReq, expressRes, (result: unknown) => {
        if (result instanceof Error) {
            throw result;
        }
    });
}
