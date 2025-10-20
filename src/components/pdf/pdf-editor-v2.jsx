import { Rnd } from 'react-rnd';
import PropTypes from 'prop-types';
import 'react-pdf/dist/Page/TextLayer.css';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Page, pdfjs, Document } from 'react-pdf';
import ReactSignatureCanvas from 'react-signature-canvas';

import { blue, grey } from '@mui/material/colors';
import {
  Box,
  Stack,
  Dialog,
  Button,
  Tooltip,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Divider,
  Chip,
  Zoom,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from '../iconify';

try {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;
} catch (error) {
  // Fallback to local worker if CDN fails
  console.warn('Failed to set CDN worker, falling back to local worker:', error);
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

const PDFEditorV2 = ({ file, annotations, setAnnotations, signURL, setSignURL }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [totalPages, setTotalPages] = useState();
  const [scale, setScale] = useState(1);
  const [currentAnnotation, setCurrentAnnotation] = useState();
  const [selectedTool, setSelectedTool] = useState('cursor');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [currentSignatureId, setCurrentSignatureId] = useState(null);

  const signRef = useRef(null);
  const signDialog = useBoolean();
  const containerRef = useRef(null);

  const onLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
  };

  const tools = [
    { id: 'cursor', icon: 'fluent:cursor-20-filled', label: 'Select', color: grey[700] },
    { id: 'signature', icon: 'mdi:fountain-pen-tip', label: 'Sign', color: blue[600] },
  ];

  const hasSignature = annotations.some((ann) => ann.type === 'signature');

  const handleToolSelect = useCallback((toolId) => {
    setSelectedTool(toolId);
    setSelectedAnnotation(null);
  }, []);

  const handleZoom = useCallback(
    (direction) => {
      setScale((prev) => {
        if (direction === 'in') return Math.min(prev + 0.25, 3);
        if (direction === 'out') return Math.max(prev - 0.25, 0.25);
        return isMobile ? 0.8 : 1;
      });
    },
    [isMobile]
  );

  const startDrawing = useCallback(
    (e, pageNumber) => {
      if (selectedTool === 'cursor') return;

      if (selectedTool === 'signature' && hasSignature) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();

      const x = (e.clientX - rect.left) / scale - 60;
      const y = (e.clientY - rect.top) / scale - 30;

      const newAnnotation = {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: selectedTool === 'signature' ? 120 : 150,
        height: selectedTool === 'signature' ? 60 : 40,
        page: pageNumber,
        type: selectedTool,
        id: Date.now(),
        signatureURL: null,
      };

      setCurrentAnnotation(newAnnotation);
    },
    [selectedTool, scale]
  );

  const stopDrawing = useCallback(() => {
    if (currentAnnotation) {
      setAnnotations((prev) => [...prev, currentAnnotation]);
      setCurrentAnnotation(null);
      if (currentAnnotation.type === 'signature') {
        setCurrentSignatureId(currentAnnotation.id);
        signDialog.onTrue();
      }
      setCurrentAnnotation(null);
    }
  }, [currentAnnotation, setAnnotations, signDialog]);

  const updateAnnotation = useCallback(
    (id, newProps) => {
      setAnnotations((prev) =>
        prev.map((annotation) =>
          annotation.id === id ? { ...annotation, ...newProps } : annotation
        )
      );
    },
    [setAnnotations]
  );

  const deleteAnnotation = useCallback(
    (id) => {
      setAnnotations((prev) => prev.filter((annotation) => annotation.id !== id));
      setSelectedAnnotation(null);
    },
    [setAnnotations]
  );

  const saveSignature = useCallback(() => {
    if (signRef.current && currentSignatureId) {
      const url = signRef.current.getTrimmedCanvas().toDataURL('image/png');
      updateAnnotation(currentSignatureId, { signatureURL: url });
      setSignURL(url);
      setCurrentSignatureId(null);
      signDialog.onFalse();
      handleToolSelect('cursor');
    }
  }, [setSignURL, currentSignatureId, signDialog, updateAnnotation]);

  const clearSignature = useCallback(() => {
    if (signRef.current) {
      signRef.current.clear();
    }
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          p: { xs: 1, sm: 1.5, md: 2 },
          boxShadow: 1,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          {/* Mobile: Stack tools and zoom in rows */}
          <Stack direction="row" spacing={{ xs: 1, sm: 2 }} sx={{ flex: 1 }}>
            {/* Tools Section */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flex: 1, justifyContent: 'center' }}
            >
              {tools.map((tool) => (
                <Tooltip
                  key={tool.id}
                  title={tool.id === 'signature' ? 'Only one signature allowed' : tool.label}
                >
                  <span>
                    <IconButton
                      onClick={() => handleToolSelect(tool.id)}
                      size={isMobile ? 'medium' : 'small'}
                      disabled={tool.id === 'signature' && hasSignature}
                      sx={{
                        bgcolor: selectedTool === tool.id ? `${tool.color}15` : 'transparent',
                        color: selectedTool === tool.id ? tool.color : 'text.secondary',
                        border:
                          selectedTool === tool.id
                            ? `2px solid ${tool.color}`
                            : '2px solid transparent',
                        minWidth: { xs: 44, sm: 40 },
                        minHeight: { xs: 44, sm: 40 },
                        '&:hover': {
                          bgcolor: `${tool.color}10`,
                        },
                      }}
                    >
                      <Iconify icon={tool.icon} width={isMobile ? 24 : 20} />
                    </IconButton>
                  </span>
                </Tooltip>
              ))}
            </Stack>

            <Divider orientation="vertical" flexItem />

            {/* Zoom Controls */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ justifyContent: 'center' }}
            >
              <IconButton
                onClick={() => handleZoom('out')}
                disabled={scale <= 0.25}
                size={isMobile ? 'medium' : 'small'}
              >
                <Iconify icon="mdi:magnify-minus" width={isMobile ? 24 : 20} />
              </IconButton>

              <Chip
                label={`${Math.round(scale * 100)}%`}
                size={isMobile ? 'medium' : 'small'}
                variant="outlined"
                sx={{ minWidth: { xs: 70, sm: 60 } }}
              />

              <IconButton
                onClick={() => handleZoom('in')}
                disabled={scale >= 3}
                size={isMobile ? 'medium' : 'small'}
              >
                <Iconify icon="mdi:magnify-plus" width={isMobile ? 24 : 20} />
              </IconButton>

              <Button
                size="small"
                onClick={() => handleZoom('reset')}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Fit
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* PDF Viewer */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: grey[100],
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            p: { xs: 0.5, sm: 2 },
            minHeight: '100%',
            minWidth: 'fit-content',
          }}
        >
          <Box sx={{ display: 'inline-block', minWidth: { xs: '100vw', sm: 'auto' } }}>
            <Document file={file} onLoadSuccess={onLoadSuccess} renderMode="canvas">
              <Stack spacing={{ xs: 1, sm: 2 }}>
                {Array(totalPages)
                  .fill()
                  .map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        cursor: selectedTool !== 'cursor' ? 'crosshair' : 'default',
                        boxShadow: { xs: 1, sm: 2 },
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'white',
                        width: 'fit-content',
                        margin: '0 auto',
                        maxWidth: { xs: '100%', sm: 'none' },
                        '&:hover': {
                          boxShadow:
                            selectedTool !== 'cursor' ? { xs: 2, sm: 4 } : { xs: 1, sm: 2 },
                        },
                      }}
                    >
                      <Page
                        pageNumber={index + 1}
                        scale={scale}
                        renderTextLayer={selectedTool === 'cursor'}
                        onMouseDown={(e) => selectedTool !== 'cursor' && startDrawing(e, index + 1)}
                        onMouseUp={stopDrawing}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          if (selectedTool !== 'cursor') {
                            const touch = e.touches[0];
                            const fakeEvent = {
                              currentTarget: e.currentTarget,
                              clientX: touch.clientX,
                              clientY: touch.clientY,
                            };
                            startDrawing(fakeEvent, index + 1);
                          }
                        }}
                        onTouchEnd={stopDrawing}
                      />

                      {/* Annotations */}
                      {annotations
                        .filter((annotation) => annotation.page === index + 1)
                        .map((annotation) => (
                          <Rnd
                            key={annotation.id}
                            style={{
                              zIndex: selectedAnnotation === annotation.id ? 100 : 10,
                            }}
                            enableResizing={{
                              bottomRight: true,
                            }}
                            bounds="parent"
                            position={{
                              x: annotation.x * scale,
                              y: annotation.y * scale,
                            }}
                            size={{
                              width: annotation.width * scale,
                              height: annotation.height * scale,
                            }}
                            onDragStop={(e, d) =>
                              updateAnnotation(annotation.id, {
                                x: d.x / scale,
                                y: d.y / scale,
                              })
                            }
                            onResizeStop={(e, direction, ref, delta, position) =>
                              updateAnnotation(annotation.id, {
                                width: ref.offsetWidth / scale,
                                height: ref.offsetHeight / scale,
                                x: position.x / scale,
                                y: position.y / scale,
                              })
                            }
                            dragHandleClassName="annotation-handle"
                            onClick={() => setSelectedAnnotation(annotation.id)}
                            touchAction="none"
                          >
                            <Box
                              className="annotation-handle"
                              sx={{
                                width: '100%',
                                height: '100%',
                                border: 2,
                                borderColor:
                                  selectedAnnotation === annotation.id ? blue[500] : grey[400],
                                borderRadius: 1,
                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                cursor: 'move',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                minHeight: { xs: 44, sm: 'auto' },
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                '&:hover': {
                                  borderColor: blue[500],
                                },
                              }}
                              onClick={(e) => {
                                if (annotation.type === 'signature' && !signURL) {
                                  e.stopPropagation();
                                  signDialog.onTrue();
                                }
                              }}
                            >
                              {annotation.type === 'signature' && signURL ? (
                                <img
                                  src={signURL}
                                  alt="Signature"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    pointerEvents: 'none',
                                  }}
                                />
                              ) : annotation.type === 'signature' ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  textAlign="center"
                                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                  {isMobile ? 'Tap to sign' : 'Click to sign'}
                                </Typography>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    outline: 'none',
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    p: { xs: 0.5, sm: 1 },
                                  }}
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) =>
                                    updateAnnotation(annotation.id, {
                                      content: e.target.textContent,
                                    })
                                  }
                                >
                                  {annotation.content || 'Type here...'}
                                </Typography>
                              )}

                              {/* Delete button - always visible for signatures, larger on mobile */}
                              <Zoom in={selectedAnnotation === annotation.id || annotation.type === 'signature'}>
                                <IconButton
                                  size={isMobile ? 'medium' : 'small'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAnnotation(annotation.id);
                                  }}
                                  sx={{
                                    position: 'absolute',
                                    top: { xs: -16, sm: -12 },
                                    right: { xs: -16, sm: -12 },
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    width: { xs: 32, sm: 28 },
                                    height: { xs: 32, sm: 28 },
                                    '&:hover': { bgcolor: 'error.dark' },
                                    boxShadow: 2,
                                    zIndex: 10,
                                  }}
                                >
                                  <Iconify icon="mdi:close" width={isMobile ? 20 : 16} />
                                </IconButton>
                              </Zoom>
                            </Box>
                          </Rnd>
                        ))}
                    </Box>
                  ))}
              </Stack>
            </Document>
          </Box>
        </Box>
      </Box>

      {/* Signature Dialog - responsive */}
      <Dialog
        open={signDialog.value}
        onClose={signDialog.onFalse}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 2 },
            margin: { xs: 2, sm: 'auto' },
            maxHeight: { xs: '90vh', sm: 'auto' },
            height: { xs: 'auto', sm: 'auto' },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: { xs: 1, sm: 2 },
          }}
        >
          Signature
          <IconButton onClick={signDialog.onFalse} sx={{ ml: 2 }}>
            <Iconify icon="mdi:close" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: 'grey.50',
              touchAction: 'none', // Prevent scrolling on mobile
            }}
          >
            <ReactSignatureCanvas
              ref={signRef}
              penColor="black"
              canvasProps={{
                style: {
                  width: '100%',
                  height: isMobile ? 200 : 180,
                  backgroundColor: 'white',
                  touchAction: 'none', // Prevent scrolling on mobile
                },
              }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 1.5,
              display: 'block',
              textAlign: 'center',
              fontSize: { xs: '0.875rem', sm: '0.75rem' },
            }}
          >
            {isMobile
              ? 'Sign above with your finger or stylus'
              : 'Sign above with your mouse or stylus'}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            gap: 1,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
          }}
        >
          <Button
            onClick={clearSignature}
            color="inherit"
            fullWidth={isMobile}
            variant={isMobile ? 'outlined' : 'text'}
          >
            Clear
          </Button>
          <Button onClick={saveSignature} variant="contained" fullWidth={isMobile}>
            Save Signature
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

PDFEditorV2.propTypes = {
  file: PropTypes.string,
  annotations: PropTypes.array,
  setAnnotations: PropTypes.func,
  signURL: PropTypes.string,
  setSignURL: PropTypes.func,
};

export default PDFEditorV2;
