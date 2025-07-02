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
export interface ModelDetails {
  name: string;
  version: string;
  context_length: string;
  parameters: string;
  device: string;
  gpu_enabled: boolean;
  gpu_name?: string;
}

export interface OCRResponse {
  raw_text: string;
  enhanced_text: string;
  model_used: string;
  confidence: number;
  processing_time: number;
  scanner_info: Record<string, any>;
  model_details?: ModelDetails;
  languages?: string[];
  raw_response?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  gpu_required: boolean;
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
  getModels: async (): Promise<{ models: ModelInfo[] }> => {
    const response = await axios.get(`${API_URL}/ocr/models`);
    return response.data;
  },

  extractText: async (
    formData: FormData,
    useGpu: boolean = false
  ): Promise<OCRResponse> => {
    formData.append("use_gpu", useGpu.toString());
    const response = await axios.post(`${API_URL}/ocr/extract-text`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  scannerExtractText: async (
    formData: FormData,
    useGpu: boolean = false
  ): Promise<OCRResponse> => {
    formData.append("use_gpu", useGpu.toString());
    const response = await axios.post(
      `${API_URL}/scanner/extract-text`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};

// Scanner API Service
export const scannerApi = {
  getScannerList: async (): Promise<ScannerInfo[]> => {
    try {
      const response = await api.get<ScannerInfo[]>("/scanner/list");
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
