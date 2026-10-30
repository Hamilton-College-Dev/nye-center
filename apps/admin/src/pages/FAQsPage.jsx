import { useEffect, useState } from 'react';

import ContentPage from './ContentPage.jsx';
import { contentConfigs, listRecords } from '../services/contentService.js';

const HIDDEN_NOTICE =
  'FAQs are hidden in the app right now — the "Show FAQs" switch on the Contact page is off. ' +
  'Anything you save here is kept, but visitors will not see it until that switch is back on.';

export default function FAQsPage() {
  const [hiddenInApp, setHiddenInApp] = useState(false);

  // FAQs are gated app-wide by contact_settings.show_faqs, which lives on a
  // different page — so editors could otherwise polish questions nobody can see.
  useEffect(() => {
    let active = true;
    listRecords(contentConfigs.contact_settings)
      .then(({ data }) => {
        if (active) setHiddenInApp(data?.[0]?.show_faqs === false);
      })
      .catch(() => {
        if (active) setHiddenInApp(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return <ContentPage config={contentConfigs.faqs} notice={hiddenInApp ? HIDDEN_NOTICE : null} />;
}
