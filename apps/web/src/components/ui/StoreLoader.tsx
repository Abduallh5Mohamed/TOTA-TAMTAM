import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function StoreLoader({ visible = true }: { visible?: boolean }) {
  return <div className={`store-loader ${visible ? 'is-visible' : ''}`} role="status" aria-live="polite" aria-label="جاري تجهيز متجر توتا وتمتام">
    <div className="store-loader-mark" aria-hidden="true"><span>T</span><i>&</i><span>T</span></div>
    <strong>TOTA <b>&</b> TAMTAM</strong>
    <p>نجهّز لكِ اختياراتك</p>
    <div className="store-loader-line"><span /></div>
  </div>;
}

export function RouteLoader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 560);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return <StoreLoader visible={visible} />;
}
