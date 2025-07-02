export interface Scanner {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
}

export interface ScanRequest {
  action: string;
  data: {
    scanner_id: string;
    resolution: number;
    color_mode: string;
    client_id?: string;
  };
}

export interface ScanResponse {
  action?: string;
  status: string;
  message?: string;
  image_data?: string;
  format?: string;
  demo?: boolean;
  success?: boolean;
}
