import { Rnd } from 'react-rnd';
import PropTypes from 'prop-types';
import 'react-pdf/dist/Page/TextLayer.css';
import React, { useRef, useState } from 'react';
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
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from '../iconify';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// eslint-disable-next-line react/prop-types
const PDFEditor = ({ file, annotations, setAnnotations, signURL, setSignURL }) => {
  const [totalPages, setTotalPages] = useState();
  const [scale, setScale] = useState(1);
  const [currentAnnotation, setCurrentAnnotation] = useState();
  const [type, setType] = useState();
  const [isHovered, setIsHovered] = useState(false);
  const testRef = useRef(null);
  const signRef = useRef(null);
  const dialog = useBoolean();

  const onLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
  };

  const startDrawing = (e, pageNumber) => {
    const rect = e.target.getBoundingClientRect();

    const x = (e.clientX - rect.left - 150) / scale; // Adjust for scaling
    const y = (e.clientY - rect.top - 150) / scale; // Adjust for scaling

    const newAnnotation = {
      x, // Normalized X position
      y, // Normalized Y position
      width: 150, // Set unscaled width (you can adjust this)
      height: 100, // Set unscaled height (you can adjust this)
      page: pageNumber, // The page number where the annotation is placed
      type,
      id: Date.now(), // Unique ID for the annotation
    };

    if (!type) {
      return;
    }
    setCurrentAnnotation(newAnnotation);
  };

  const stopDrawing = () => {
    if (currentAnnotation) {
      setAnnotations([...annotations, currentAnnotation]);
      setCurrentAnnotation(null);
    }
  };

  const updateAnnotation = (id, newProps) => {
    setAnnotations((prev) =>
      prev.map((annotation) => (annotation.id === id ? { ...annotation, ...newProps } : annotation))
    );
  };

  const clearSignature = () => {
    signRef.current.clear();
  };

  const saveSignature = () => {
    const url = signRef.current.getTrimmedCanvas().toDataURL('image/png');
    setSignURL(url);
    dialog.onFalse();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <Box
        zIndex={3}
        p={1.5}
        sx={{
          borderBottom: 1,
          bgcolor: (theme) => theme.palette.background.paper,
        }}
      >
        <Typography variant="h5" fontWeight="bolder">
          Tools
        </Typography>
        <Stack direction="row" spacing={1} my={1}>
          <Tooltip title="Cursor">
            <IconButton
              color="white"
              sx={{
                '&:hover': {
                  outline: 1,
                  bgcolor: '#D1D1D1',
                },
                borderRadius: 1,
                bgcolor: 'white',
                scale: 1,
                outline: type === 'cursor' && 3,
                outlineColor: blue[500],
              }}
              onClick={() => setType('cursor')}
            >
              <Iconify icon="fluent:cursor-20-filled" color="black" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Pencil">
            <IconButton
              color="white"
              sx={{
                '&:hover': {
                  outline: 1,
                  bgcolor: '#D1D1D1',
                },
                borderRadius: 1,
                bgcolor: 'white',
                scale: 1,
                outline: type === 'pencil' && 3,
                outlineColor: blue[500],
              }}
              onClick={() => setType('pencil')}
            >
              <Iconify icon="mdi:pencil" color="black" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton
              color="white"
              onClick={() => setScale(scale + 0.2)}
              sx={{
                '&:hover': {
                  outline: 1,
                  bgcolor: '#D1D1D1',
                },
                borderRadius: 1,
                bgcolor: 'white',
                scale: 1,
              }}
            >
              <Iconify icon="gg:zoom-in" color="black" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton
              onClick={() => scale > 0.8 && setScale(scale - 0.2)}
              sx={{
                '&:hover': {
                  outline: 1,
                  bgcolor: '#D1D1D1',
                },
                borderRadius: 1,
                bgcolor: 'white',
                scale: 1,
              }}
            >
              <Iconify icon="gg:zoom-out" color="black" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Box
        sx={{
          overflow: 'auto',
          scrollbarWidth: 'none',
        }}
        height={500}
      >
        <Box textAlign="center">
          <Box display="inline-flex">
            <Document file={file} onLoadSuccess={onLoadSuccess} renderMode="canvas">
              <Stack gap={2}>
                {Array(totalPages)
                  .fill()
                  .map((i, index) => (
                    <Box
                      key={index}
                      position="relative"
                      sx={{
                        cursor: type && type !== 'cursor' && 'pointer',
                      }}
                    >
                      <Page
                        key={index}
                        scale={scale}
                        pageNumber={index + 1}
                        renderTextLayer={type === 'cursor'}
                        onMouseDown={(e) => type !== 'cursor' && startDrawing(e, index + 1)}
                        onMouseUp={stopDrawing}
                      />
                      {annotations
                        // eslint-disable-next-line react/prop-types
                        .filter((item) => item.page === index + 1)
                        .map((annotation) => (
                          <Rnd
                            ref={testRef}
                            key={annotation.id}
                            enableResizing={{
                              top: false,
                              left: false,
                              right: false,
                              bottom: false,
                              topLeft: false,
                              topRight: false,
                              bottomLeft: false,
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
                            // scale={scale}
                            dragHandleClassName="handle"
                            resizeHandleClasses={{
                              bottomRight: 'cc-resize',
                            }}
                            resizeHandleComponent={{
                              bottomRight: (
                                <Box
                                  className="cc-resize"
                                  sx={{
                                    position: 'absolute',
                                    top: -10,
                                    right: 12,
                                    zIndex: 100000,
                                  }}
                                >
                                  <Iconify
                                    icon="pajamas:resize"
                                    width={15}
                                    height={15}
                                    color={grey[600]}
                                  />
                                </Box>
                              ),
                            }}
                            lockAspectRatio={annotation.type === 'pencil'}
                            style={{
                              border: 4,
                            }}
                          >
                            <Box
                              component="div"
                              className="sign-container"
                              onMouseEnter={handleMouseEnter}
                              onMouseLeave={handleMouseLeave}
                              sx={{
                                width: '100%',
                                height: '100%',
                                outline: 1.5,
                                outlineColor: isHovered ? grey[700] : grey[500],
                                borderRadius: 1,
                                transition: '.1s linear',
                                cursor: 'pointer',
                                zIndex: 500,
                                position: 'relative',
                              }}
                              onClick={(e) => {
                                if (
                                  e?.target?.className?.includes('sign-container') ||
                                  e?.target?.className?.includes('css-zgqxma')
                                ) {
                                  dialog.onTrue();
                                }
                              }}
                            >
                              {annotation.type === 'pencil' && signURL ? (
                                <img
                                  src={signURL}
                                  width="100%"
                                  height="100%"
                                  draggable={false}
                                  alt="asd"
                                />
                              ) : (
                                <Typography
                                  variant="subtitle1"
                                  color="black"
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                  }}
                                >
                                  Click and Sign
                                </Typography>
                              )}
                              <Stack
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  bottom: -35,
                                }}
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <IconButton
                                  className="handle"
                                  color="black"
                                  sx={{
                                    borderRadius: 1,
                                    cursor: 'move',
                                    bgcolor: 'white',
                                    zIndex: 5000,
                                  }}
                                  size="small"
                                >
                                  <Iconify icon="fluent:drag-20-filled" />
                                </IconButton>
                                <IconButton
                                  className="delete"
                                  color="black"
                                  sx={{
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    bgcolor: 'white',
                                  }}
                                  size="small"
                                  onClick={() => {
                                    // eslint-disable-next-line react/prop-types
                                    const removed = annotations.filter(
                                      (item) => item.id !== annotation.id
                                    );
                                    setAnnotations(removed);
                                  }}
                                >
                                  <Iconify icon="ic:round-delete" color="red" />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Rnd>
                        ))}
                    </Box>
                  ))}
              </Stack>
            </Document>
          </Box>
        </Box>
        {/* </Box> */}
      </Box>

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm">
        <DialogTitle>Digital Signature</DialogTitle>
        <DialogContent>
          <Box>
            <ReactSignatureCanvas
              ref={signRef}
              penColor="black"
              canvasProps={{
                style: {
                  backgroundColor: 'white',
                  width: '100%',
                  height: 200,
                  cursor: 'crosshair',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button size="small" variant="outlined" onClick={clearSignature}>
            Clear
          </Button>
          <Button size="small" variant="contained" onClick={saveSignature}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* <Button onClick={downloadPdf}>Download</Button> */}
    </>
  );
};

export default PDFEditor;

PDFEditor.propTypes = {
  file: PropTypes.string,
};
