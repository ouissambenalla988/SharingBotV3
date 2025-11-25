import { createWorker } from 'tesseract.js';

export class OCRService {
  static async extractTextFromImage(imageFile: File): Promise<{ 
    text: string; 
    language: string;
    confidence: number;
  }> {
    let worker;
    
    try {
      console.log('🔄 Initialisation OCR...');
      
      worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.loadLanguage('fra');
      await worker.loadLanguage('ara');
      await worker.initialize('eng+fra+ara');
      
      console.log('📸 Traitement de:', imageFile.name);
      const { data } = await worker.recognize(imageFile);
      
      return {
        text: data.text,
        language: 'fr', // Détection sera faite après avec Franc
        confidence: data.confidence || 0
      };
      
    } catch (error) {
      console.error('❌ Erreur OCR:', error);
      throw new Error('Échec de l\'extraction OCR');
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }
} 