import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload an image',
    description: 'Upload an image file (JPEG, PNG, WebP, GIF, AVIF). Returns the stored object key and URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'images', description: 'Storage folder prefix' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or no file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );
  }

  @Post('video')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload a video',
    description: 'Upload a video file (MP4, WebM, AVI, MKV, MOV). Returns the stored object key and URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'videos', description: 'Storage folder prefix' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or no file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.uploadVideo(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );
  }

  @Get('presigned-url/:key(*)')
  @ApiOperation({
    summary: 'Get presigned URL',
    description: 'Generate a time-limited presigned URL for a stored file. The key can include folder prefixes.',
  })
  @ApiParam({ name: 'key', description: 'Object key (e.g. "images/uuid.jpg")' })
  @ApiQuery({ name: 'expiry', required: false, type: Number, description: 'URL expiry in seconds (default: 3600)' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated' })
  async getPresignedUrl(
    @Param('key') key: string,
    @Query('expiry') expiry?: number,
  ) {
    const expirySeconds = expiry ?? 3600;
    return this.mediaService.getPresignedUrlWithExpiry(key, expirySeconds);
  }

  @Delete(':key(*)')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Permanently delete a file from storage by its object key.',
  })
  @ApiParam({ name: 'key', description: 'Object key to delete' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFile(@Param('key') key: string) {
    return this.mediaService.deleteFile(key);
  }
}
