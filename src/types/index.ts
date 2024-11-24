export interface VideoEntry {
  id: string;
  video_id: string;
  name: string;
  postDate: string;
  creatorUsername: string;
  gmv: number;
  hasSparkCode: boolean;
  dateAdded: string;
  tags: string[];
  status: 'pending' | 'authorized' | 'unauthorized';
  sparkCode?: string;
}

export interface UploadSummaryData {
  newEntries: number;
  duplicates: number;
  errors: number;
  total: number;
  errorMessages: string[];
}