import { Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class AwsService {
  private client: S3Client
  private bucketName = this.configService.get("AWS_BUCKET_NAME")
  private s3Region = this.configService.get("AWS_BUCKET_REGION")

  constructor(
    private readonly configService: ConfigService,
  ) {
    const s3_region = this.configService.get("AWS_BUCKET_REGION")

    if (!s3_region) {
      throw new Error('S3_Region not found in environment variables')
    }

    this.client = new S3Client({
      region: s3_region,
      credentials: {
        accessKeyId: this.configService.get("AWS_PUBLIC_KEY"),
        secretAccessKey: this.configService.get("AWS_SECRET_KEY")
      },
      forcePathStyle: true
    })
  }

  async uploadFile(file: Express.Multer.File, type: 'product' | 'profile') {
    const buffer = file.buffer
    // Generar un UUID para el nombre del archivo
    const fileId = uuidv4()
    const extension = file.originalname.split('.').pop()

    // Ruta basada en el tipo de imagen
    const folder = type === 'product' ? 'products' : 'profiles'
    const uploadParams = {
      Bucket: this.bucketName,
      Key: `${folder}/${fileId}.${extension}`,
      Body: Buffer.from(buffer)
    }

    const command = new PutObjectCommand(uploadParams)
    const result = await this.client.send(command)

    console.log(result)

    return {
      result,
      publicUrl: `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${folder}/${fileId}.${extension}`
    }
  }

  async deleteFileFromS3(fileUrl: string) {
    // const fileKey = fileUrl.split(`${this.bucketName}/`)[1]
    try {
      const urlParts = new URL(fileUrl)
      const fileKey = urlParts.pathname.substring(1)
      console.log('File key:', fileKey)


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
}
