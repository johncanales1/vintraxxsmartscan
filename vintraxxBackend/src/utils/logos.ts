import fs from 'fs';
import path from 'path';
import logger from './logger';

let vintraxxLogoBase64: string | null = null;
let motorsLogoBase64: string | null = null;

function loadLogoBase64(filename: string): string | null {
  try {
    const filePath = path.resolve(__dirname, '../assets', filename);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
    logger.warn(`Logo file not found: ${filePath}`);
    return null;
  } catch (error) {
    logger.warn(`Failed to load logo: ${filename}`, { error: (error as Error).message });
    return null;
  }
}

export function getVintraxxLogoBase64(): string | null {
  if (!vintraxxLogoBase64) {
    vintraxxLogoBase64 = loadLogoBase64('VinTraxxLOGO.jpeg');
  }
  return vintraxxLogoBase64;
}

export function getMotorsLogoBase64(): string | null {
  if (!motorsLogoBase64) {
    motorsLogoBase64 = loadLogoBase64('35MotorsLOGO.jpeg');
  }
  return motorsLogoBase64;
}

export function getEmailLogoHeaderHtml(title: string, subtitle?: string): string {
  const vintraxxLogo = getVintraxxLogoBase64();
  const motorsLogo = getMotorsLogoBase64();

  return `
    <div style="background: #1a1a2e; padding: 16px 24px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="120" style="text-align: left; vertical-align: middle;">
            ${vintraxxLogo ? `<img src="${vintraxxLogo}" alt="VinTraxx" style="height: 45px; width: auto; max-width: 110px;" />` : ''}
          </td>
          <td style="text-align: center; vertical-align: middle;">
            <div style="font-size: 20px; font-weight: bold; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">${title}</div>
            ${subtitle ? `<div style="font-size: 13px; color: #cccccc; margin-top: 4px; font-family: Arial, Helvetica, sans-serif;">${subtitle}</div>` : ''}
          </td>
          <td width="120" style="text-align: right; vertical-align: middle;">
            ${motorsLogo ? `<img src="${motorsLogo}" alt="35 Motors" style="height: 45px; width: auto; max-width: 110px;" />` : ''}
          </td>
        </tr>
      </table>
    </div>`;
}
