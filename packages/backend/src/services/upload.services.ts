// packages/backend/src/services/upload.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

export class UploadService {
    private bucket = process.env.AWS_S3_BUCKET || 'pizzaria-app';
    private allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    private maxSize = 5 * 1024 * 1024; // 5MB

    /**
     * Validar arquivo de imagem
     */
    validarImagem(file: Express.Multer.File): { valido: boolean; erro?: string } {
        // Validar tipo
        if (!this.allowedTypes.includes(file.mimetype)) {
            return {
                valido: false,
                erro: 'Tipo de arquivo não permitido. Use: JPG, PNG ou WEBP'
            };
        }

        // Validar tamanho
        if (file.size > this.maxSize) {
            return {
                valido: false,
                erro: 'Arquivo muito grande. Tamanho máximo: 5MB'
            };
        }

        return { valido: true };
    }

    /**
     * Upload para S3
     */
    async uploadParaS3(file: Express.Multer.File): Promise<string> {
        try {
            // Validar arquivo
            const validacao = this.validarImagem(file);
            if (!validacao.valido) {
                throw new Error(validacao.erro);
            }

            // Processar imagem (redimensionar e comprimir)
            const imagemProcessada = await sharp(file.buffer)
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            // Gerar nome único
            const nomeArquivo = `produtos/${uuidv4()}.jpg`;

            // Upload para S3
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: nomeArquivo,
                Body: imagemProcessada,
                ContentType: 'image/jpeg',
                ACL: 'public-read'
            });

            await s3Client.send(command);

            // Retornar URL pública
            const url = `https://${this.bucket}.s3.amazonaws.com/${nomeArquivo}`;
            return url;

        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            throw error;
        }
    }

    /**
     * Deletar do S3
     */
    async deletarDoS3(url: string): Promise<void> {
        try {
            // Extrair key da URL
            const key = url.split('.com/')[1];

            if (!key) {
                throw new Error('URL inválida');
            }

            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key
            });

            await s3Client.send(command);
            console.log(`✅ Imagem deletada: ${key}`);

        } catch (error) {
            console.error('Erro ao deletar imagem:', error);
            throw error;
        }
    }

    /**
     * Upload local (para desenvolvimento)
     */
    async uploadLocal(file: Express.Multer.File): Promise<string> {
        try {
            const validacao = this.validarImagem(file);
            if (!validacao.valido) {
                throw new Error(validacao.erro);
            }

            // Processar imagem
            const imagemProcessada = await sharp(file.buffer)
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            const nomeArquivo = `${uuidv4()}.jpg`;
            const fs = require('fs');
            const path = require('path');

            // Criar pasta uploads se não existir
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const caminho = path.join(uploadsDir, nomeArquivo);
            fs.writeFileSync(caminho, imagemProcessada);

            return `/uploads/${nomeArquivo}`;

        } catch (error) {
            console.error('Erro ao fazer upload local:', error);
            throw error;
        }
    }

    /**
     * Upload (decide entre S3 ou local baseado no ambiente)
     */
    async upload(file: Express.Multer.File): Promise<string> {
        const ambiente = process.env.NODE_ENV || 'development';

        if (ambiente === 'production') {
            return await this.uploadParaS3(file);
        } else {
            return await this.uploadLocal(file);
        }
    }
}
