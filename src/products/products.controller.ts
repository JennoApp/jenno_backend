import { Controller, Get, Post, Delete, Request, Body, UseGuards, Param, Query, ParseIntPipe, UseInterceptors, UploadedFiles, NotFoundException, BadRequestException, ForbiddenException, UploadedFile } from '@nestjs/common'
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AwsService } from 'src/aws/aws.service';

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private usersService: UsersService,
    private awsService: AwsService
  ) { }

  @Get()
  getProducts(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('country') country: string,
    @Query('category') category: string
  ) {
    return this.productsService.getProducts(page, limit, country, category)
  }

  @Get('/search')
  getSearchProducts(@Query('query') query: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.productsService.searchProducts(query, page, limit)
  }

  @Get(':id')
  getProduct(@Param('id') id) {
    return this.productsService.getProduct(id)
  }

  @Get('/category/:category')
  getProductsByCategory(@Param('category') category: string, @Query('page') page: number, @Query('limit') limit: number, @Query('country') country: string) {
    return this.productsService.getProductsByCategory(category, page, limit, country)
  }

  @Get('/user/:userId')
  getProductsbyUser(@Param('userId') userId, @Query('page') page: number, @Query('limit') limit: number, @Query('country') country: string) {
    return this.productsService.getProductsbyUser(userId, page, limit, country)
  }

  @Get('/admin/user/:userId')
  getProductsbyUserOrdered(@Param('userId') userId, @Query('page') page: number, @Query('limit') limit: number, @Query('country') country: string) {
    return this.productsService.getProductsbyUserOrdered(userId, page, limit, country)
  }

  @Get('/user/random/:userId')
  getProductsRandombyUser(@Param('userId') userId) {
    return this.productsService.getProductsRandombyUser(userId)
  }

  @Get('randomfollowed/:userid')
  getRandomProductsFromFollowedShops(@Param('userid') userid: string, @Query('page', ParseIntPipe) page: number = 1, @Query('limit', ParseIntPipe) limit: number = 1, @Query('country') country?: string) {
    return this.productsService.getRandomProductsFromFollowedShops(userid, page, limit, country)
  }

  @Get('/searchbyuser/:id')
  getSearchProductsbyUser(@Param('id') userId, @Query('query') query: string, @Query('page') page: number, @Query('limit') limit: number) {
    return this.productsService.searchProductsbyUser(userId, query, page, limit)
  }

  @Get('/categories/random')
  getRandomCategories(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10

    if (isNaN(numLimit) || numLimit <= 0) {
      throw new BadRequestException('El limite debe ser un numero positivo.')
    }

    return this.productsService.getRandomCategories(numLimit)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(@Request() req, @Body() product: ProductDto) {
    // verificar que el producto exista
    const productData = await this.productsService.getProduct(product.productId)

    const userId = req.user.userId
    let productId = product.productId

    // Crear o actualizar datos "principales" del producto
    if (productId) {
      // Actualizar producto
      await this.productsService.updateProduct(productId, {
        productId: product.productId,
        productname: product.productname,
        description: product.description,
        imgs: product.imgs,
        price: product.price,
        quantity: product.quantity,
        SKU: product.SKU,
        category: product.category,
        shippingfee: product.shippingfee,
        weight: product.weight,
        /// dimensions
        dimensions: {
          length: product.dimensions.length,
          width: product.dimensions.width,
          height: product.dimensions.height,
        },
        ///
        status: product.status,
        user: req.user.userId,
        username: req.user.username,
        country: Array.isArray(product.country) && product.country.length > 0
          ? this.productsService.ensureUniqueCountries(productData?.country, product.country)
          : this.productsService.ensureUniqueCountries(productData?.country, [req.user.country]),

        ///
        options: product.options,
        especifications: product.especifications,
        visibility: product.visibility
      })
    } else {
      // Crear producto
      const created = await this.productsService.createProduct({
        productname: product.productname,
        description: product.description,
        imgs: product.imgs,
        price: product.price,
        quantity: product.quantity,
        SKU: product.SKU,
        category: product.category,
        shippingfee: product.shippingfee,
        weight: product.weight,
        /// dimensions
        dimensions: {
          length: product.dimensions.length,
          width: product.dimensions.width,
          height: product.dimensions.height,
        },
        ///
        status: product.status,
        user: req.user.userId,
        username: req.user.username,
        country: product.country && Array.isArray(product.country) && product.country.length > 0
          ? product.country
          : [req.user.country],
        options: product.options,
        especifications: product.especifications,
        visibility: product.visibility
      })
      productId = created._id.toString();

      const user: any = await this.usersService.getUser(userId)
      user.products.push(created._id)
      await user.save()
    }

    console.log('💡 product.additionalInfo recibido:', product.additionalInfo);

    // Si hay additionalInfo, migramos imágenes y guardamos el HTML limpio
    if (typeof product.additionalInfo === 'string' && product.additionalInfo.trim()) {
      console.log('✅ Procesando migrateDraftImages...');
      const cleanHtml = await this.productsService.migrateDraftImages(
        productId,
        product.additionalInfo,
        userId
      );

      console.log('🧼 HTML limpio obtenido:', cleanHtml);

      product.additionalInfo = cleanHtml;

      await this.productsService.updateAdditionalInfo(
        productId,
        cleanHtml
      )

      console.log('📦 additionalInfo actualizado en base de datos.');
    } else {
      console.log('❌ additionalInfo vacío o inválido, no se guarda nada.');
    }

    return {
      success: true,
      productId,
      message: productId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente'
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-images/:productId')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadProductImages(
    @Request() req,
    @Param('productId') productId: string,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    try {
      const userId = req.user.userId

      // verificar que el producto exista
      const product = await this.productsService.getProduct(productId)
      if (!product) {
        throw new NotFoundException('Producto no encontrado')
      }

      // verificar que el producto pertenezca al usuario
      if (product.user.toString() !== userId) {
        throw new NotFoundException('No tienes permiso para modificar este producto')
      }

      // solo eliminar imagenes antiguas si se han subido nuevas
      if (files && files.length > 0) {
        // Si el producto tiene imágenes existentes, eliminarlas de S3
        try {
          if (product.imgs && product.imgs.length > 0) {
            await Promise.all(
              product.imgs.map(imageUrl =>
                this.awsService.deleteFileFromS3(imageUrl)
              )
            );
          }
        } catch (deleteError) {
          console.error('Error al eliminar imágenes antiguas:', deleteError);
          throw new Error('Error al eliminar las imágenes antiguas');
        }

        // Subir las nuevas imágenes una por una
        const uploadPromises = files.map(async (file) => {
          const { publicUrl } = await this.awsService.uploadFile(file, 'product');
          return publicUrl;
        });

        // Esperar a que todas las imágenes se suban
        const uploadedImageUrls = await Promise.all(uploadPromises);

        // Actualizar el producto con las nuevas Urls
        product.imgs = uploadedImageUrls

      }


      await product.save()

      return {
        success: true,
        message: 'Imagenes actualizadas exitosamente',
        images: product.imgs
      }

    } catch (error) {
      console.error('Error en uploadProductImages:', error);
      throw error;
    }
  }

  @Delete(':productid')
  deleteProduct(@Param('productid') productid) {
    return this.productsService.deleteProduct(productid)
  }

  @Post('/review/:productid')
  addReview(@Param('productid') productid: string, @Body() reviewData: any) {
    const product = this.productsService.addReviewToProduct(productid, reviewData)
    console.log({ productController: product })

    return product
  }

  @Post('updatevisibility/:id')
  async updateVisibility(@Param('id') id, @Body() body: { visibility: boolean }) {
    if (typeof body.visibility !== 'boolean') {
      return {
        message: 'El campo visibility debe ser booleano'
      }
    }

    const updatedProduct = await this.productsService.updateVisibility(id, body.visibility)

    return {
      message: 'Visibilidad actualizada correctamente',
      product: {
        id: updatedProduct?._id,
        visibility: updatedProduct?.visibility
      }
    }
  }


  @UseGuards(JwtAuthGuard)
  @Post('additional-info/:productId')
  async saveAdditionalInfo(
    @Request() req,
    @Param('productId') productId: string,
    @Body('additionalInfo') newHtml: string
  ) {
    const userId = req.user.userId;

    // 1. Buscar producto
    const product = await this.productsService.getProduct(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 2. Verificar si el producto pertenece al usuario
    if (product.user.toString() !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este producto');
    }

    // 3. Actualizar la info adicional (esto también limpia imágenes no usadas)
    const updated = await this.productsService.updateAdditionalInfo(productId, newHtml);

    return {
      success: true,
      additionalInfo: updated.additionalInfo,
    };
  }


  @UseGuards(JwtAuthGuard)
  @Post('upload-additional-info/:productId')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadAdditionalInfoImages(
    @Request() req,
    @Param('productId') productId: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const userId = req.user.userId;
    const product = await this.productsService.getProduct(productId);
    if (!product || product.user.toString() !== userId) {
      throw new NotFoundException('Producto no encontrado o sin permiso');
    }
    if (!files?.length) {
      throw new BadRequestException('No se recibieron archivos');
    }

    const urls = await Promise.all(
      files.map(file => this.awsService.uploadFile(file, 'additionalInfo').then(r => r.publicUrl))
    );

    return { success: true, urls };
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-additional-info-draft')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAdditionalInfoDraft(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió archivo');
    }
    const userId = req.user.userId;
    const { publicUrl } = await this.awsService.uploadFile(file, 'draft', userId);
    return { success: true, url: publicUrl };
  }
}
