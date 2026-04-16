import { useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const POSTNITRO_API_KEY = 'pn-a0hccp9db8wjaecxqgcfbg99';
const POSTNITRO_TEMPLATE_ID = 'fanb2h68m7kdcbkaqfhukdvm';

export default function usePostNitro() {
  const { api } = useAuth();
  const editorRef = useRef(null);

  const initEditor = useCallback(async () => {
    if (editorRef.current) return editorRef.current;
    try {
      const { createEditor } = await import('@postnitro/embed');
      editorRef.current = createEditor({ apiKey: POSTNITRO_API_KEY });
      return editorRef.current;
    } catch (e) {
      console.error('PostNitro SDK init error:', e);
      return null;
    }
  }, []);

  const openEditor = useCallback(async (contentId, projectId, initialText) => {
    const editor = await initEditor();
    if (!editor) {
      alert('Errore caricamento PostNitro SDK');
      return;
    }

    return new Promise((resolve) => {
      editor.createDesign({ templateId: POSTNITRO_TEMPLATE_ID }, async (exportData) => {
        try {
          if (exportData.type === 'png' && Array.isArray(exportData.data)) {
            const uploaded = [];
            for (let i = 0; i < exportData.data.length; i++) {
              const blob = exportData.data[i];
              const formData = new FormData();
              formData.append('file', blob, `postnitro_slide_${i + 1}.png`);
              const { data } = await api.post(`/media/upload/${contentId}`, formData);
              uploaded.push(data);
            }
            resolve({ success: true, media: uploaded, count: uploaded.length });
          } else if (exportData.data instanceof Blob) {
            const formData = new FormData();
            formData.append('file', exportData.data, `postnitro_export.${exportData.type || 'png'}`);
            const { data } = await api.post(`/media/upload/${contentId}`, formData);
            resolve({ success: true, media: [data], count: 1 });
          } else {
            resolve({ success: false, error: 'Formato export non supportato' });
          }
        } catch (e) {
          console.error('PostNitro upload error:', e);
          resolve({ success: false, error: e.message });
        }
      });
    });
  }, [initEditor, api]);

  return { openEditor };
}
