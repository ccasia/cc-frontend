// eslint-disable-next-line new-cap
import { jsPDF } from 'jspdf';
import { useState } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { enqueueSnackbar } from 'notistack';

// Preview generation and PDF export for the PCR report. Both capture the rendered
// report DOM via html2canvas; preview is cached until content changes.
export default function usePcrExport({ editableContent, sectionVisibility, sectionOrder, isEditMode, setIsEditMode, reportRef, campaign }) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isPreviewCached, setIsPreviewCached] = useState(false);
  const [lastPreviewContent, setLastPreviewContent] = useState(null);

  // Generate preview - simulates PDF export view with page breaks
  const handleGeneratePreview = async () => {
    try {
      // Check if content has changed since last preview
      const currentContentHash = JSON.stringify({
        content: editableContent,
        visibility: sectionVisibility,
        order: sectionOrder
      });

      // If preview is cached and content hasn't changed, just open the modal
      if (isPreviewCached && lastPreviewContent === currentContentHash && previewImages.length > 0) {
        setIsPreviewOpen(true);
        return;
      }

      setIsExportingPDF(true);
      enqueueSnackbar('Generating preview...', {
        variant: 'info',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });

      // First, temporarily exit edit mode and hide all edit controls
      const wasInEditMode = isEditMode;
      if (wasInEditMode) {
        setIsEditMode(false);
      }

      // Wait for React to re-render
      await new Promise(resolve => { setTimeout(resolve, 50); });

      const reportContainer = document.getElementById('pcr-report-main');
      if (!reportContainer) {
        console.error('Report container not found');
        if (wasInEditMode) setIsEditMode(true);
        setIsExportingPDF(false);
        return;
      }

      // Hide buttons before capturing
      const buttonsToHide = reportContainer.querySelectorAll('.hide-in-pdf');
      buttonsToHide.forEach(el => {
        el.style.display = 'none';
      });

      // Get all sections
      const sections = reportContainer.querySelectorAll('.pcr-section');

      if (sections.length === 0) {
        // Fallback: capture entire report as one page
        const canvas = await html2canvas(reportContainer, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          windowWidth: 1078,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewImages([imgData]);
      } else {
        // Capture each section separately and organize into pages
        const pageHeight = 297;
        const pageWidth = 210;
        const margin = 5;
        const contentWidth = pageWidth - (2 * margin);
        const maxPageHeight = pageHeight - (2 * margin);

        const pages = [];
        let currentPage = [];
        let currentPageHeight = 0;

        // Batch process sections with yield to UI thread
        const processSections = async () => {
          const results = [];

          for (let i = 0; i < sections.length; i += 1) {
            const section = sections[i];

            // Yield to UI thread every 2 sections
            if (i % 2 === 0 && i > 0) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise(resolve => { setTimeout(resolve, 0); });
            }

            // Capture this section with high quality for preview
            // eslint-disable-next-line no-await-in-loop
            const canvas = await html2canvas(section, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#FFFFFF',
              windowWidth: 1078,
              imageTimeout: 0,
              removeContainer: true,
            });

            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            results.push({ canvas, imgWidth, imgHeight });
          }

          return results;
        };

        const sectionResults = await processSections();

        // Organize sections into pages
        sectionResults.forEach(({ canvas, imgWidth, imgHeight }) => {
          // Check if section fits on current page
          if (currentPageHeight + imgHeight > maxPageHeight && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
          }

          currentPage.push({
            canvas,
            height: imgHeight,
            width: imgWidth
          });
          currentPageHeight += imgHeight + 4;
        });

        if (currentPage.length > 0) {
          pages.push(currentPage);
        }

        // Create page images with gradient background at higher DPI for preview
        const dpi = 150;
        const pageCanvasWidth = (pageWidth * dpi) / 25.4;
        const pageCanvasHeight = (pageHeight * dpi) / 25.4;

        const renderPages = async () => {
          const pageImages = [];

          // Process pages sequentially
          // eslint-disable-next-line no-restricted-syntax
          for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
            const page = pages[pageIndex];

            // Yield to UI thread
            // eslint-disable-next-line no-await-in-loop
            await new Promise(resolve => { setTimeout(resolve, 0); });

            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = pageCanvasWidth;
            pageCanvas.height = pageCanvasHeight;
            const ctx = pageCanvas.getContext('2d', { alpha: false });

            // Draw gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, pageCanvas.height);
            gradient.addColorStop(0, '#1340FF');
            gradient.addColorStop(1, '#8A5AFE');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

            // Draw sections on this page
            let yOffset = (margin * dpi) / 25.4;
            page.forEach(section => {
              const xOffset = (margin * dpi) / 25.4;
              const sectionWidth = (section.width * dpi) / 25.4;
              const sectionHeight = (section.height * dpi) / 25.4;

              ctx.drawImage(section.canvas, xOffset, yOffset, sectionWidth, sectionHeight);
              yOffset += sectionHeight + ((4 * dpi) / 25.4);
            });

            pageImages.push(pageCanvas.toDataURL('image/png', 1.0));
          }

          return pageImages;
        };

        const pageImages = await renderPages();
        setPreviewImages(pageImages);
      }

      buttonsToHide.forEach(el => {
        el.style.display = '';
      });
      if (wasInEditMode) {
        setIsEditMode(true);
      }

      setLastPreviewContent(currentContentHash);
      setIsPreviewCached(true);

      setIsPreviewOpen(true);
      enqueueSnackbar('Preview generated!', {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      enqueueSnackbar('Failed to generate preview', {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });

      if (isEditMode === false) {
        setIsEditMode(true);
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  // PDF Export function
  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      setIsExportingPDF(true);
      enqueueSnackbar('Generating PDF...', {
        variant: 'info',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });

      // Get the parent element that includes the gradient border
      const pdfContainer = reportRef.current.parentElement;

      // Hide buttons before capturing
      const buttonsToHide = pdfContainer.querySelectorAll('.hide-in-pdf');
      buttonsToHide.forEach(el => {
        el.style.display = 'none';
      });

      // Remove margins from sections (keep border-radius for curved edges)
      const allSections = pdfContainer.querySelectorAll('.pcr-section');
      allSections.forEach(el => {
        el.style.marginBottom = '0';
        // Keep borderRadius for curved edges in PDF
      });

      // Wait for charts to fully render (especially SVG-based charts like PieChart)
      await new Promise(resolve => { setTimeout(resolve, 500); });

      // eslint-disable-next-line new-cap
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false, // Disable compression for HD quality
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 5;
      const contentWidth = pageWidth - (2 * margin);

      const addGradientBackground = async () => {
        const gradientCanvas = document.createElement('canvas');
        const dpi = 600; // Ultra-HD DPI (maximum practical quality)
        gradientCanvas.width = (pageWidth * dpi) / 25.4;
        gradientCanvas.height = (pageHeight * dpi) / 25.4;
        const ctx = gradientCanvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, gradientCanvas.height);
        gradient.addColorStop(0, '#1340FF');
        gradient.addColorStop(1, '#8A5AFE');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);

        const gradientData = gradientCanvas.toDataURL('image/png'); // PNG for lossless quality
        pdf.addImage(gradientData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'SLOW');
      };

      const sections = pdfContainer.querySelectorAll('.pcr-section');

      if (sections.length === 0) {
        await addGradientBackground();

        const canvas = await html2canvas(pdfContainer, {
          scale: 3, // Higher scale for better quality
          useCORS: true,
          logging: false,
          backgroundColor: null,
          windowWidth: 1078,
          windowHeight: pdfContainer.scrollHeight,
          imageTimeout: 0,
          removeContainer: true,
          allowTaint: true,
          foreignObjectRendering: false,
          onclone: (clonedDoc) => {
            // Fix all elements to match original styling
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              try {
                const original = pdfContainer.querySelector(`[data-cursor-element-id="${el.dataset.cursorElementId}"]`) || el;
                const computedStyle = window.getComputedStyle(original);

                // Preserve all visual styles
                if (computedStyle.background && computedStyle.background !== 'none') {
                  el.style.background = computedStyle.background;
                }
                if (computedStyle.boxShadow && computedStyle.boxShadow !== 'none') {
                  el.style.boxShadow = computedStyle.boxShadow;
                }
                if (computedStyle.borderRadius && computedStyle.borderRadius !== '0px') {
                  el.style.borderRadius = computedStyle.borderRadius;
                }
                if (computedStyle.filter && computedStyle.filter !== 'none') {
                  el.style.filter = computedStyle.filter;
                }
                if (computedStyle.opacity && computedStyle.opacity !== '1') {
                  el.style.opacity = computedStyle.opacity;
                }

                // Font rendering
                el.style.webkitFontSmoothing = 'antialiased';
                el.style.mozOsxFontSmoothing = 'grayscale';
                el.style.textRendering = 'optimizeLegibility';
              } catch (e) {
                // Skip if element not found
              }
            });

            // Fix images - prevent stretching
            const allImages = clonedDoc.querySelectorAll('img');
            allImages.forEach((img) => {
              img.style.objectFit = 'contain';
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.display = 'block';
            });

            // Fix SVG charts
            const allSvgs = clonedDoc.querySelectorAll('svg');
            allSvgs.forEach((svg) => {
              svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
              svg.style.display = 'block';
              svg.style.visibility = 'visible';
            });
          },
        });

        const imgData = canvas.toDataURL('image/png'); // PNG for lossless quality
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'SLOW');
      } else {
        // Add gradient to first page
        await addGradientBackground();

        // Capture each section separately
        let currentY = margin;
        let isFirstSection = true;

        const processPdfSections = async () => {
          for (let i = 0; i < sections.length; i += 1) {
            const section = sections[i];

            // Yield to UI thread every 2 sections
            if (i % 2 === 0 && i > 0) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise(resolve => { setTimeout(resolve, 0); });
            }

            // Sequential processing is required for PDF generation
            // eslint-disable-next-line no-await-in-loop
            const canvas = await html2canvas(section, {
              scale: 3, // Higher scale for better quality
              useCORS: true,
              logging: false,
              backgroundColor: '#FFFFFF',
              windowWidth: 1078,
              windowHeight: section.scrollHeight,
              imageTimeout: 0,
              removeContainer: true,
              allowTaint: true,
              foreignObjectRendering: false,
              onclone: (clonedDoc) => {
                // Fix all elements to match original styling
                const allElements = clonedDoc.querySelectorAll('*');
                allElements.forEach((el) => {
                  try {
                    const original = section.querySelector(`[data-cursor-element-id="${el.dataset.cursorElementId}"]`) || el;
                    const computedStyle = window.getComputedStyle(original);

                    // Preserve all visual styles
                    if (computedStyle.background && computedStyle.background !== 'none') {
                      el.style.background = computedStyle.background;
                    }
                    if (computedStyle.boxShadow && computedStyle.boxShadow !== 'none') {
                      el.style.boxShadow = computedStyle.boxShadow;
                    }
                    if (computedStyle.borderRadius && computedStyle.borderRadius !== '0px') {
                      el.style.borderRadius = computedStyle.borderRadius;
                    }
                    if (computedStyle.filter && computedStyle.filter !== 'none') {
                      el.style.filter = computedStyle.filter;
                    }
                    if (computedStyle.opacity && computedStyle.opacity !== '1') {
                      el.style.opacity = computedStyle.opacity;
                    }

                    // Font rendering
                    el.style.webkitFontSmoothing = 'antialiased';
                    el.style.mozOsxFontSmoothing = 'grayscale';
                    el.style.textRendering = 'optimizeLegibility';
                  } catch (e) {
                    // Skip if element not found
                  }
                });

                // Fix images - prevent stretching
                const allImages = clonedDoc.querySelectorAll('img');
                allImages.forEach((img) => {
                  img.style.objectFit = 'contain';
                  img.style.maxWidth = '100%';
                  img.style.height = 'auto';
                  img.style.display = 'block';
                });

                // Fix SVG charts
                const allSvgs = clonedDoc.querySelectorAll('svg');
                allSvgs.forEach((svg) => {
                  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                  svg.style.display = 'block';
                  svg.style.visibility = 'visible';
                });
              },
            });

            const imgData = canvas.toDataURL('image/png'); // PNG for lossless quality
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (currentY + imgHeight > pageHeight - margin && !isFirstSection) {
              pdf.addPage();
              // eslint-disable-next-line no-await-in-loop
              await addGradientBackground();
              currentY = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'SLOW');
            currentY += imgHeight + 4;

            isFirstSection = false;
          }
        };

        await processPdfSections();
      }

      // Restore buttons and margins
      buttonsToHide.forEach(el => {
        el.style.display = '';
      });
      allSections.forEach(el => {
        el.style.marginBottom = '';
      });

      const fileName = `PCR_${campaign?.name || 'Report'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      enqueueSnackbar('PDF downloaded successfully!', {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      enqueueSnackbar('Failed to generate PDF', {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return {
    isExportingPDF,
    isPreviewOpen,
    setIsPreviewOpen,
    previewImages,
    setIsPreviewCached,
    handleGeneratePreview,
    handleExportPDF,
  };
}
