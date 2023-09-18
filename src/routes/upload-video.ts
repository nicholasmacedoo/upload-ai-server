import { FastifyInstance } from "fastify";
import fastifyMultipart from "@fastify/multipart";
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { prisma } from "../lib/prisma";


const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
    
    app.register(fastifyMultipart, {
        limits: {
            fileSize: 1_848_576 * 25, // 25mb
        }
    })

    app.post('/videos', async (request, reply) => {
        const data = await request.file()
        
        if(!data) return reply.status(400).send({ error: 'Nenhum arquivo encontrado.'})

        const extensionExplode = (data.filename.split('.')) 
        const extension = `.${extensionExplode[extensionExplode.length - 1]}`

        if(extension !== '.mp3') return reply.status(400).send({ error: 'Tipo do arquivo é inválido, por favor faça upload de MP3'})
    
        const fileBasename = path.basename(data.fieldname, extension)
        const fileUploadName = `${fileBasename}-${randomUUID()}${extension}`

        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)
        
        await pump(data.file, fs.createWriteStream(uploadDestination))

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadDestination,
            }
        })

        return {
            video
        }
    })
}