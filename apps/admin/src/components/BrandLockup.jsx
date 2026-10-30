import { useState } from 'react';

// Logo only — the wordmark text was dropped from both the sidebar and the
// login card. `inverse` picks the white logo for dark backgrounds; the navy
// one disappears against the sidebar.
// Hamilton-approved logos live at apps/admin/public/hamilton-logo{,-white}.png.
export default function BrandLockup({ inverse = false }) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoFailed)
    return (
      <div className="brand-mark" aria-hidden="true">
        H
      </div>
    );

  return (
    <img
      alt="Hamilton College"
      className="brand-logo"
      src={inverse ? '/hamilton-logo-white.png' : '/hamilton-logo.png'}
      onError={() => setLogoFailed(true)}
    />
  );
}
