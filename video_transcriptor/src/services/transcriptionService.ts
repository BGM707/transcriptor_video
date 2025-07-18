import { supabase, TranscriptionRecord } from '../lib/supabase';

export class TranscriptionService {
  static async createTranscriptionJob(
    fileName: string,
    fileSize: number,
    targetLanguage: string
  ): Promise<TranscriptionRecord> {
    const { data, error } = await supabase
      .from('transcriptions')
      .insert({
        file_name: fileName,
        file_size: fileSize,
        status: 'uploading',
        progress: 0,
        target_language: targetLanguage,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTranscriptionJob(
    id: string,
    updates: Partial<TranscriptionRecord>
  ): Promise<TranscriptionRecord> {
    const { data, error } = await supabase
      .from('transcriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getTranscriptionJobs(): Promise<TranscriptionRecord[]> {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async uploadFile(file: File, jobId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${jobId}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error } = await supabase.storage
      .from('video-files')
      .upload(filePath, file);

    if (error) throw error;
    return filePath;
  }

  static async processVideo(jobId: string, filePath: string, targetLanguage: string): Promise<void> {
    try {
      // Call the edge function to process the video with real AI APIs
      const { data, error } = await supabase.functions.invoke('process-video', {
        body: {
          jobId,
          filePath,
          targetLanguage
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      await this.updateTranscriptionJob(jobId, {
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Error desconocido',
      });
      throw error;
    }
  }

  static async extractAudio(jobId: string, filePath: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('extract-audio', {
      body: {
        jobId,
        filePath
      }
    });

    if (error) throw error;
    return data.audioPath;
  }

  static async getPublicUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('video-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  static async deleteTranscriptionJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}