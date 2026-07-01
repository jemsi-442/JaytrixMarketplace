import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_SIGNATURES = {
  "image/jpeg": {
    extension: ".jpg",
    matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  "image/png": {
    extension: ".png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a,
  },
  "image/webp": {
    extension: ".webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
};
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productUploadsDir = path.resolve(__dirname, "../uploads/products");
const deliveryUploadsDir = path.resolve(__dirname, "../uploads/delivery-proofs");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new ApiError(400, "Invalid file type. Allowed: jpeg, png, webp"));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
});

const sanitizeFilename = (name = "product") =>
  String(name)
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 80) || "product";

const detectImageType = (fileBuffer) => {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length < 8) {
    throw new ApiError(400, "Image could not be verified");
  }

  const match = Object.entries(IMAGE_SIGNATURES).find(([, signature]) => signature.matches(fileBuffer));
  if (!match) {
    throw new ApiError(400, "Image could not be verified");
  }

  const [mimeType, signature] = match;
  return { mimeType, extension: signature.extension };
};

const assertAllowedImage = (fileBuffer, expectedMimeType) => {
  const detected = detectImageType(fileBuffer);
  if (expectedMimeType && detected.mimeType !== expectedMimeType) {
    throw new ApiError(400, "Image type does not match the uploaded content");
  }
  return detected;
};

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_NAME &&
      !process.env.CLOUDINARY_NAME.startsWith("replace_with_") &&
      process.env.CLOUDINARY_API_KEY &&
      !process.env.CLOUDINARY_API_KEY.startsWith("replace_with_") &&
      process.env.CLOUDINARY_API_SECRET &&
      !process.env.CLOUDINARY_API_SECRET.startsWith("replace_with_")
  );

export const uploadProductImageToCloudinary = async (fileBuffer, originalname = "product", expectedMimeType = null) => {
  if (!fileBuffer) throw new ApiError(400, "No image file provided");
  assertAllowedImage(fileBuffer, expectedMimeType);

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
        public_id: `${Date.now()}-${sanitizeFilename(originalname)}`,
      },
      (error, result) => {
        if (error) return reject(new ApiError(502, "Cloudinary upload failed", error));
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });

  return {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };
};

export const saveProductImageLocally = async (fileBuffer, originalname = "product", expectedMimeType = null) => {
  if (!fileBuffer) throw new ApiError(400, "No image file provided");
  const detected = assertAllowedImage(fileBuffer, expectedMimeType);

  await fs.mkdir(productUploadsDir, { recursive: true });

  const filename = `${Date.now()}-${sanitizeFilename(originalname)}${detected.extension}`;
  const filepath = path.join(productUploadsDir, filename);

  await fs.writeFile(filepath, fileBuffer);

  return {
    url: `/uploads/products/${filename}`,
    publicId: null,
  };
};

export const uploadProductImage = async (fileBuffer, originalname = "product", expectedMimeType = null) => {
  if (isCloudinaryConfigured()) {
    return uploadProductImageToCloudinary(fileBuffer, originalname, expectedMimeType);
  }

  if (process.env.NODE_ENV === "production") {
    throw new ApiError(503, "Image uploads are temporarily unavailable");
  }

  return saveProductImageLocally(fileBuffer, originalname, expectedMimeType);
};

export const uploadDeliveryProofImageToCloudinary = async (fileBuffer, originalname = "delivery-proof", expectedMimeType = null) => {
  if (!fileBuffer) throw new ApiError(400, "No image file provided");
  assertAllowedImage(fileBuffer, expectedMimeType);

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "delivery-proofs",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
        public_id: `${Date.now()}-${sanitizeFilename(originalname)}`,
      },
      (error, result) => {
        if (error) return reject(new ApiError(502, "Cloudinary upload failed", error));
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });

  return {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };
};

export const saveDeliveryProofImageLocally = async (fileBuffer, originalname = "delivery-proof", expectedMimeType = null) => {
  if (!fileBuffer) throw new ApiError(400, "No image file provided");
  const detected = assertAllowedImage(fileBuffer, expectedMimeType);

  await fs.mkdir(deliveryUploadsDir, { recursive: true });

  const filename = `${Date.now()}-${sanitizeFilename(originalname)}${detected.extension}`;
  const filepath = path.join(deliveryUploadsDir, filename);

  await fs.writeFile(filepath, fileBuffer);

  return {
    url: `/uploads/delivery-proofs/${filename}`,
    publicId: null,
  };
};

export const uploadDeliveryProofImage = async (fileBuffer, originalname = "delivery-proof", expectedMimeType = null) => {
  if (isCloudinaryConfigured()) {
    return uploadDeliveryProofImageToCloudinary(fileBuffer, originalname, expectedMimeType);
  }

  if (process.env.NODE_ENV === "production") {
    throw new ApiError(503, "Image uploads are temporarily unavailable");
  }

  return saveDeliveryProofImageLocally(fileBuffer, originalname, expectedMimeType);
};
