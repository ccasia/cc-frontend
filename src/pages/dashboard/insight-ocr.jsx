import { Helmet } from 'react-helmet-async';

import InsightOcrView from 'src/sections/insight-ocr/view/insight-ocr-view';

export default function InsightOcrPage() {
  return (
    <>
      <Helmet>
        <title>Insight OCR Test</title>
      </Helmet>

      <InsightOcrView />
    </>
  );
}
