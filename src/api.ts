import Fastify from 'fastify'
import config from '@/config'
import * as capture from '@/capture'

import pino, { Logger, LoggerOptions } from 'pino';
import fs from 'fs';

export default async function () {
    const logFilePath = './fanbox-api.log';
    const zeroPad = (value: number): string => {
        return value < 10 ? `0${value}` : `${value}`;
    };
    const customTimestamp = () => {
        const now = new Date();
        const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        const formattedDate = `${jstNow.getFullYear()}-${zeroPad(jstNow.getMonth() + 1)}-${zeroPad(jstNow.getDate())} ${zeroPad(jstNow.getHours())}:${zeroPad(jstNow.getMinutes())}:${zeroPad(jstNow.getSeconds())}`;
        return `,"time":"${formattedDate}"`;
    };

    const loggerOptions: LoggerOptions = {
        timestamp: customTimestamp,
    };

    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, '');
    }

    const logger: Logger = pino({
        formatters: {
            log: (log) => log,
        },
        ...loggerOptions,
    }, fs.createWriteStream(logFilePath, { flags: 'a' }));

    type Locals = { responseBody?: string };
    const app = Fastify({ logger });
    //const app = Fastify()

    app.setErrorHandler((err, req, res) => {
        console.error(`RequestID: ${req.id},`, err)
        logger.error(`RequestID: ${req.id}, ${err.message}`);
        res.status(500).send(`Internal Server Error (RequestID: ${req.id})`)
    })

    app.get('/api/:type', async (req, res) => {
        const type = (req.params as any).type as keyof typeof capture.ApiType
        if (!Object.keys(capture.ApiType).includes(type)) return res.status(400).send('Bad Request')

        const data = await capture.get(type)
        res.send(data)
    })

    app.addHook('onResponse', (req, res) => {
        if (!(req.method === 'GET' || req.method === 'HEAD')) return
        console.info(`${req.method} ${res.statusCode} ${req.url} (${res.elapsedTime}ms)`)
        logger.info(`${req.method} ${res.statusCode} ${req.url} (${res.elapsedTime}ms)`);
    })

    app.listen({
        port: Number(config.server.port),
        host: '0.0.0.0'
    }, (err, address) => {
        if (err) {
            logger.error(err);
            console.error(err)
            process.exit(1)
        }
        logger.info(`Server listening at ${address}`);
        console.info(`Server listening at ${address}`)
    })
}