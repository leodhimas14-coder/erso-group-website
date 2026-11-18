import { useEffect, useState } from 'react';
import Icon from './Icon';
import { IS_DEMO } from '../lib/api';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

/** "Instalo aplikacionin" – Android/desktop use the native prompt, iPhone gets instructions. */
export default function InstallButton({ className = 'btn btn-ghost' }) {
  const [prompt, setPrompt] = useState(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (IS_DEMO || installed || (!prompt && !isIos())) return null;

  const onClick = async () => {
    if (prompt) {
      prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else {
      setShowIosHelp(true);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={onClick}>
        <Icon name="download" size={18} /> Instalo aplikacionin
      </button>
      {showIosHelp && (
        <div className="sheet-backdrop" onClick={() => setShowIosHelp(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Instalo Panda.al në iPhone</h3>
            <ol>
              <li>Shtyp butonin <b>Share</b> (katrori me shigjetë) poshtë në Safari.</li>
              <li>Zgjidh <b>Add to Home Screen</b> (Shto në ekranin bazë).</li>
              <li>Shtyp <b>Add</b>. Panda.al do të shfaqet si aplikacion.</li>
            </ol>
            <button type="button" className="btn btn-primary btn-block" onClick={() => setShowIosHelp(false)}>Në rregull</button>
          </div>
        </div>
      )}
    </>
  );
}
