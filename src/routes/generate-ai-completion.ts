import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from 'zod'
import { streamToResponse, OpenAIStream } from "ai";
import { openai } from "../lib/openai";

export async function generateAICompletionRoute(app: FastifyInstance) {
    app.post('/ai/complete', async (request, reply) => {
        const paramsSchema = z.object({
            videoId: z.string().uuid(),
            prompt: z.string(),
            temperature: z.number().min(0).max(1).default(0.5)
        })
        
        const { videoId, temperature, prompt } = paramsSchema.parse(request.body)
        
        const video = await prisma.video.findUniqueOrThrow({
            where: {
                id: videoId,
            }
        })

        if(!video.transcription) {
            return reply.status(400).send({ error: 'video transcription was not generated yet.'})
        }

        const promptMessage = prompt.replace('{transcription}', video.transcription)
    
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo-16k',
            temperature,
            messages: [
                { role: 'user', content: promptMessage }
            ],
            stream: true,
        })

        //return response
        const stream = OpenAIStream(response)

        streamToResponse(stream, reply.raw, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST'
            }
        })
    })
}