import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class AwsService {
  private client: S3Client
  private bucketName: string
  private s3Region: string

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME')
    this.s3Region = this.configService.get<string>('AWS_BUCKET_REGION')

    if (!this.s3Region) {
      throw new Error('S3_Region not found in environment variables')
    }

    this.client = new S3Client({
      region: this.s3Region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_PUBLIC_KEY'),
        secretAccessKey: this.configService.get<string>('AMAZONWS_SECRET_KEY')
      },
      forcePathStyle: true
    })
  }

  async uploadFile(
    file: Express.Multer.File,
    type: 'product' | 'profile' | 'additionalInfo' | 'draft',
    userId?: string // solo se usa para el tipo 'draft'
  ) {
    const buffer = file.buffer
    // Generar un UUID para el nombre del archivo
    const fileId = uuidv4()
    const extension = file.originalname.split('.').pop()
    let folder: string

    switch (type) {
      case 'product':
        folder = 'products';
        break;
      case 'profile':
        folder = 'profiles';
        break;
      case 'additionalInfo':
        folder = 'additionalInfo';
        break;
      case 'draft':
        if (!userId) {
          throw new ForbiddenException('userId es requerido para borradores')
        }
        folder = `drafts/${userId}`;
        break;
      default:
        folder = '';
    }


    const key = `${folder}/${fileId}.${extension}`;
    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: Buffer.from(buffer)
    }

    const command = new PutObjectCommand({
      ...uploadParams,
      ContentType: file.mimetype,
    })
    const result = await this.client.send(command)

    return {
      result,
      publicUrl: `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${key}`
    }
  }

  /**
   * Elimina un archivo de S3 dada su URL pública.
   */
  async deleteFileFromS3(fileUrl: string) {
    try {
      const urlParts = new URL(fileUrl)
      const fileKey = urlParts.pathname.substring(1)

      if (!urlParts.hostname.includes(this.bucketName)) {
        throw new Error('La URL no pertenece a este bucket');
      }

      const deleteParams = {
        Bucket: this.bucketName,
        Key: fileKey
      }

      const command = new DeleteObjectCommand(deleteParams)
      await this.client.send(command)

      console.log('Imagen eliminada de S3:', fileUrl)
    } catch (error) {
      console.error('Error al eliminar archivo de S3:', error)
      throw error
    }
  }

  /**
   * Copia un archivo de S3 de una clave origen a una clave destino.
   * Luego elimina el origen. Útil para migrar drafts a carpeta final.
   */
  async moveFile(fromKey: string, toKey: string): Promise<string> {
    // Copiar
    const copyCmd = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${fromKey}`,
      Key: toKey,
      ACL: 'public-read'
    });
    await this.client.send(copyCmd);

    // Eliminar origen
    const delCmd = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fromKey
    });
    await this.client.send(delCmd);

    return `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${toKey}`;
  }
}
