import { FastifyInstance } from "fastify";
import { createReadStream } from 'node:fs'
import { prisma } from "../lib/prisma";
import { z } from 'zod'
import { openai } from "../lib/openai";

export async function generateAICompletionRoute(app: FastifyInstance) {
    app.post('/ai/complete', async (request) => {
        const paramsSchema = z.object({
            videoId: z.string().uuid(),
            template: z.string(),
            temperature: z.number().min(0).max(1).default(0.5)
        })

        const { videoId, temperature, template } = paramsSchema.parse(request.params)

        return {
            videoId, 
            temperature, 
            template
        }
        
    })
}