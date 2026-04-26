import {
  InstagramLogo,
  LinkedinLogo,
  FacebookLogo,
  TiktokLogo,
  PinterestLogo,
} from '@phosphor-icons/react';

export const MONTH_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const GoogleDriveIcon = ({ size = 16 }) => (
  <img
    src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png"
    alt="Google Drive"
    style={{ width: size, height: size, objectFit: 'contain' }}
  />
);

export const PLATFORM_ICONS = {
  instagram: { Icon: InstagramLogo, color: '#E4405F', name: 'Instagram' },
  facebook: { Icon: FacebookLogo, color: '#1877F2', name: 'Facebook' },
  linkedin: { Icon: LinkedinLogo, color: '#0A66C2', name: 'LinkedIn' },
  tiktok: { Icon: TiktokLogo, color: '#ffffff', name: 'TikTok' },
  pinterest: { Icon: PinterestLogo, color: '#E60023', name: 'Pinterest' },
  google_slides: { Icon: GoogleDriveIcon, color: '#1EA362', name: 'Google Drive' },
};
