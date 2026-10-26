import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import 'multer';


@Injectable()
export class CloudinaryService {
    constructor() {
        // Configure Cloudinary with your .env credentials
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    // Upload an image buffer to Cloudinary
    async uploadImage(
        file: Express.Multer.File,
        folder: string = 'lms_thumbnails',
    ): Promise<UploadApiResponse> {
        if (!file) {
            throw new BadRequestException('No image file provided.');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                },
                (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Cloudinary upload returned empty response.'));
                    resolve(result);
                },
            );

            // Convert file buffer to readable stream and pipe to Cloudinary
            Readable.from(file.buffer).pipe(uploadStream);
        });
    }
}
