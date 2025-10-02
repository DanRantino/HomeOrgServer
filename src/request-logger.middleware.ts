import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;

  const { method, originalUrl, body } = req;
  console.log("🚀 ~ requestLogger ~ req:", req)
  const start = Date.now();

  // Log da entrada
  Logger.log(JSON.stringify({
    type: 'request',
    timestamp: new Date().toISOString(),
    requestId,
    method,
    url: originalUrl,
    body: { ...body, password: body?.password ? '****' : undefined },
  }), 'HTTP');

  // Log da saída
  const oldSend = res.send.bind(res);
  res.send = (data?: any) => {
    const duration = Date.now() - start;
    Logger.log(JSON.stringify({
      type: 'response',
      timestamp: new Date().toISOString(),
      requestId,
      method,
      url: originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      body: data ? JSON.parse(data.toString()) : undefined,
    }), 'HTTP');

    return oldSend(data);
  };

  next();
}
