import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

interface CSVVideoData {
  name: string | null;
  post_date: string;
  creator_username: string;
  gmv: number;
}

interface CSVColumnMap {
  name: number;
  post_date: number;
  creator_username: number;
  gmv: number;
}

export function findColumnIndices(headerRow: string): CSVColumnMap {
  const headers = headerRow.split(',').map(h => h.trim().toLowerCase());
  const columnMap: Partial<CSVColumnMap> = {};

  const columnMappings = {
    name: ['Video name', 'video name', 'name', 'title'],
    post_date: ['Video post date', 'video post date', 'post date', 'date', 'posted', 'post_date'],
    creator_username: ['Creator username', 'creator username', 'creator', 'username', 'creator_username'],
    gmv: ['GMV', 'gmv', 'revenue', 'earnings']
  };

  for (const [field, possibleNames] of Object.entries(columnMappings)) {
    const index = headers.findIndex(h => possibleNames.includes(h));
    if (index === -1) {
      throw new Error(`Required column not found: ${field}. Possible names: ${possibleNames.join(', ')}`);
    }
    columnMap[field as keyof CSVColumnMap] = index;
  }

  return columnMap as CSVColumnMap;
}

export function parseCSVLine(line: string, lineNumber: number, columnMap: CSVColumnMap): CSVVideoData {
  const fields = line.split(',').map(field => field.trim());
  
  if (fields.length < Math.max(...Object.values(columnMap)) + 1) {
    throw new Error(
      `Line ${lineNumber}: Not enough fields. Expected at least ${Math.max(...Object.values(columnMap)) + 1} fields`
    );
  }

  const name = fields[columnMap.name] || null;
  const postDate = fields[columnMap.post_date];
  const creatorUsername = fields[columnMap.creator_username];
  const gmvStr = fields[columnMap.gmv];

  if (!postDate) {
    throw new Error(`Line ${lineNumber}: Post Date cannot be empty`);
  }

  if (!creatorUsername) {
    throw new Error(`Line ${lineNumber}: Creator Username cannot be empty`);
  }

  if (!gmvStr) {
    throw new Error(`Line ${lineNumber}: GMV cannot be empty`);
  }

  const gmv = parseFloat(gmvStr.replace(/[^0-9.-]+/g, ''));
  if (isNaN(gmv)) {
    throw new Error(`Line ${lineNumber}: Invalid GMV value: ${gmvStr}`);
  }

  try {
    return {
      name,
      post_date: parseDate(postDate),
      creator_username: creatorUsername.replace('@', ''),
      gmv
    };
  } catch (error) {
    throw new Error(`Line ${lineNumber}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', dateString);
    return new Date().toISOString();
  }
}

async function checkForDuplicates(videos: any[], userId: string) {
  const duplicates: any[] = [];
  const newVideos: any[] = [];

  for (const video of videos) {
    const { data, error } = await supabase
      .from('videos')
      .select('id')
      .eq('user_id', userId)
      .eq('name', video.name)
      .eq('post_date', parseDate(video.postDate))
      .eq('creator_username', video.creatorUsername);

    if (error) throw error;

    if (data && data.length > 0) {
      duplicates.push(video);
    } else {
      newVideos.push(video);
    }
  }

  return { duplicates, newVideos };
}

export async function saveVideos(videos: any[], userId: string) {
  const { duplicates, newVideos } = await checkForDuplicates(videos, userId);

  if (newVideos.length > 0) {
    const { error } = await supabase
      .from('videos')
      .upsert(
        newVideos.map(video => ({
          id: uuidv4(),
          video_id: '',
          name: video.name,
          post_date: parseDate(video.postDate),
          creator_username: video.creatorUsername,
          gmv: video.gmv,
          spark_code: video.sparkCode || '',
          status: video.status,
          user_id: userId,
          created_at: new Date().toISOString()
        }))
      );

    if (error) throw error;
  }

  return {
    inserted: newVideos.length,
    duplicates: duplicates.length
  };
}

export async function deleteAllVideos(userId: string) {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

export async function fetchUserVideos(userId: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((video: any) => ({
    id: video.id,
    video_id: video.video_id || '',
    name: video.name,
    postDate: video.post_date,
    creatorUsername: video.creator_username,
    gmv: video.gmv,
    sparkCode: video.spark_code || '',
    status: video.status,
    dateAdded: video.created_at,
    tags: video.tags || []
  }));
}