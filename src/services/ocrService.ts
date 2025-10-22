// src/services/ocrService.ts
import Tesseract from 'tesseract.js';

export const OCRService = {
  preprocessImage: async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        const scale = Math.min(1200 / img.width, 1200 / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Amélioration du contraste
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const threshold = 128;
          const value = gray < threshold ? 0 : 255;
          data[i] = value;     // Rouge
          data[i + 1] = value; // Vert
          data[i + 2] = value; // Bleu
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
    });
  },

  recognizeLicensePlate: async (
    processedImage: string,
    onProgress?: (progress: number) => void
  ): Promise<{ plate: string | null; rawText: string; confidence: number }> => {
    try {
      const passes = [1, 1.2, 1.5];
      let bestResult = { plate: '', confidence: 0, rawText: '' };

      for (let i = 0; i < passes.length; i++) {
        const scale = passes[i];
        const result = await Tesseract.recognize(processedImage, 'eng+fra', {
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
          tessedit_pageseg_mode: 7,
          tessedit_ocr_engine_mode: 3,
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              const baseProgress = (i / passes.length) * 100;
              const currentPassProgress = (m.progress || 0) * (100 / passes.length);
              onProgress(Math.round(baseProgress + currentPassProgress));
            }
          },
        });

        let text = result.data.text
          .replace(/[\n\r\t\s]/g, '')
          .replace(/[^A-Z0-9]/gi, '')
          .trim()
          .toUpperCase();

        text = OCRService.autoCorrectPlateText(text);

        if (result.data.confidence > bestResult.confidence && text.length >= 4) {
          bestResult = {
            plate: text,
            confidence: result.data.confidence,
            rawText: result.data.text
          };
        }
      }

      return {
        plate: bestResult.plate || null,
        rawText: bestResult.rawText,
        confidence: bestResult.confidence
      };
    } catch (err: any) {
      console.error('❌ Erreur OCRService:', err);
      throw new Error(`Erreur OCR: ${err.message}`);
    }
  },

  autoCorrectPlateText: (text: string): string => {
    if (!text) return '';
    
    let corrected = text.toUpperCase();
    
    const corrections: Record<string, string> = {
      'O': '0', 'Q': '0', 'D': '0',
      'I': '1', 'L': '1', 'T': '1',
      'Z': '2', 
      'S': '5', 
      'B': '8',
      'G': '6'
    };

    corrected = corrected.split('').map(char => corrections[char] || char).join('');

    if (corrected.length < 4 || corrected.length > 10) {
      return corrected;
    }

    return corrected;
  },

  validateLicensePlate: (plate: string): boolean => {
    if (!plate) return false;
    const cleanPlate = plate.replace(/\s+/g, '').toUpperCase();
    
    const regexTunisie = /^\d{1,4}[A-Z]{1,3}\d{1,4}$/;
    const regexIntl = /^[A-Z0-9]{4,10}$/;
    
    return regexTunisie.test(cleanPlate) || regexIntl.test(cleanPlate);
  },
};