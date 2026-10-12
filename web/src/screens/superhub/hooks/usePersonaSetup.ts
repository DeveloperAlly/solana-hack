import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useHubLinks } from '../paths';
import type { InfluencerSetupData } from '../types';

/**
 * Influencer-Setup state (n-is): persona fields with validation; brand and voice are chosen by the person, never
 * pre-selected, and the preview follows them. Avatar files are counted locally, never uploaded here. Save draft, and
 * Create persona, which goes on to the approval queue once brand and voice are chosen.
 */
export function usePersonaSetup(data: InfluencerSetupData) {
  const navigate = useNavigate();
  const links = useHubLinks();
  const [name, setName] = useState(data.name);
  const [brand, setBrand] = useState('');
  const [voice, setVoice] = useState('');
  const [pillars, setPillars] = useState(data.pillars);
  const [files, setFiles] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function validate() {
    const problem = !name.trim() || /^\[.*\]$/.test(name.trim()) ? 'Give the persona its own name.' : null;
    setError(problem);
    return !problem;
  }

  const persona = data.personaOf[brand] ?? data.preview.persona;
  const voiceName = data.voiceOptions.find((v) => v.value === voice)?.label;
  const ready = brand !== '' && voice !== '';

  return {
    persona, voiceName, ready,
    name, setName, brand, setBrand, voice, setVoice, pillars, setPillars, error, saved,
    files, pickFiles: (list: FileList | null) => setFiles(list?.length ?? 0),
    // INTEGRATION: POST …/personas (backend map row "Influencer-Setup, Influencer-Queue"); avatar files go to Storage.
    save: () => { if (validate()) setSaved(true); },
    create: () => { if (ready && validate()) navigate(links.influencerQueue); },
  };
}
