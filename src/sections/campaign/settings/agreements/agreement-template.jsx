import dayjs from 'dayjs';
import { useState } from 'react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Page, pdfjs, Document } from 'react-pdf';

import {
  Box,
  Table,
  Stack,
  styled,
  Button,
  Dialog,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Typography,
  DialogTitle,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetTemplate } from 'src/hooks/use-get-template';

import { useAuthContext } from 'src/auth/hooks';

import PDFEditorModal from '../../create/pdf-editor';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: 'black',
  textAlign: 'center',
}));

const AgreementTemplates = () => {
  const { data, isLoading } = useGetTemplate();
  const { user } = useAuthContext();
  const [pages, setPages] = useState(0);
  const [url, setUrl] = useState('');
  const dialog = useBoolean();
  const smDown = useResponsive('down', 'sm');
  const editor = useBoolean();

  return (
    <Box sx={{ height: 1 }}>
      <Box my={2} textAlign="end">
        <Button
          variant="outlined"
          sx={{
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
          }}
          fullWidth={smDown}
          onClick={editor.onTrue}
        >
          Create new template
        </Button>
      </Box>

      {isLoading && <Typography>Loading...</Typography>}

      {!isLoading && data?.length ? (
        <TableContainer sx={{ height: 500, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell
                  sx={{
                    borderRadius: '10px 0 0 10px',
                  }}
                >
                  Template
                </StyledTableCell>
                <StyledTableCell>Name in agreement</StyledTableCell>
                <StyledTableCell>IC Number in agreement</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell>Use by</StyledTableCell>
                <StyledTableCell
                  sx={{
                    borderRadius: '0 10px 10px 0',
                  }}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {[...data, ...data]?.map((template, index) => (
                <TableRow key={template?.id}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell align="center">{template?.adminName}</TableCell>
                  <TableCell align="center">{template?.adminICNumber}</TableCell>
                  <TableCell align="center">{dayjs(template?.createdAt).format('LL')}</TableCell>
                  <TableCell align="center">{`${template?.campaign?.length || 0} campaign`}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      sx={{
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                      }}
                      onClick={() => {
                        setUrl(template?.url);
                        dialog.onTrue();
                      }}
                    >
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No Agreement templates found.</Typography>
      )}

      <Dialog open={dialog.value} onClose={dialog.onFalse} fullWidth maxWidth="md">
        <DialogTitle>Agreement Template</DialogTitle>
        <DialogContent>
          <Box
            my={4}
            maxHeight={500}
            overflow="auto"
            textAlign="center"
            sx={{ scrollbarWidth: 'none' }}
          >
            <Box
              sx={{
                display: 'inline-block',
              }}
            >
              <Document
                file={url}
                onLoadSuccess={({ numPages }) => setPages(numPages)}
                renderMode="canvas"
              >
                <Stack spacing={2}>
                  {pages &&
                    Array.from({ length: pages }, (_, index) => (
                      <Page
                        key={index}
                        pageIndex={index}
                        pageNumber={index + 1}
                        scale={1}
                        renderTextLayer={false}
                      />
                    ))}
                </Stack>
              </Document>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <PDFEditorModal open={editor.value} onClose={editor.onFalse} user={user} />
    </Box>
  );
};

export default AgreementTemplates;
