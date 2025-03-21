import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:8000/api/v1";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface OCRResponse {
  raw_text: string;
  enhanced_text: string;
  model_used: string;
  confidence: number;
  processing_time: number;
  scanner_info?: Record<string, any>;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

export interface ModelsResponse {
  models: ModelInfo[];
}

export interface ScannerInfo {
  id: string;
  name: string;
  vendor: string;
  model: string;
  type: string;
}

export interface ScannerListResponse {
  scanners: ScannerInfo[];
}

export interface ScanDocumentResponse {
  image: string;
}

// Error handling
const handleError = (error: AxiosError) => {
  if (error.response) {
    const errorData = error.response.data as { detail?: string };
    throw new Error(errorData.detail || "An error occurred");
  } else if (error.request) {
    throw new Error("No response received from server");
  } else {
    throw new Error(error.message);
  }
};

// OCR API Service
export const ocrApi = {
  getModels: async (): Promise<ModelsResponse> => {
    try {
      const response = await api.get<ModelsResponse>("/ocr/models");
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  extractText: async (formData: FormData): Promise<OCRResponse> => {
    try {
      const response = await api.post<OCRResponse>(
        "/ocr/extract-text",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  scannerExtractText: async (
    imageData: string,
    model: string = "phi3",
    languages: string[] = [],
    scannerInfo: ScannerInfo
  ): Promise<OCRResponse> => {
    try {
      console.log("Extracting text from scanner:", imageData);
      const payload = {
        payload: {
          image_data: imageData,
          scanner_info: scannerInfo,
        },
        model,
        languages,
      };

      const response = await api.post<OCRResponse>(
        "/ocr/scanner/extract-text",
        payload
      );
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
};

// Scanner API Service
export const scannerApi = {
  getScannerList: async (): Promise<ScannerListResponse> => {
    try {
      const response = await api.get<ScannerListResponse>("/scanner/list");
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },

  scanDocument: async (scannerId: string): Promise<ScanDocumentResponse> => {
    try {
      const response = await api.get<ScanDocumentResponse>(
        `/scanner/scan/${scannerId}`
      );
      return response.data;
    } catch (error) {
      return handleError(error as AxiosError);
    }
  },
};
