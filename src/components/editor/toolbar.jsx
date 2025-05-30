import PropTypes from 'prop-types';

import { Divider } from '@mui/material';

import { StyledEditorToolbar } from './styles';

// ----------------------------------------------------------------------

const HEADINGS = ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Heading 5', 'Heading 6'];

export const formats = [
  'align',
  'background',
  'blockquote',
  'bold',
  'bullet',
  'code',
  'code-block',
  'color',
  'direction',
  'font',
  'formula',
  'header',
  'image',
  'indent',
  'italic',
  'link',
  'list',
  'script',
  'size',
  'strike',
  'table',
  'underline',
  'video',
];

export default function Toolbar({ id, simple, quillRef, savedRange, ...other }) {
  // const [url, setUrl] = useState('');
  // const [anchorEl, setAnchorEl] = useState(null);

  // const handleClick = (event) => {
  //   setAnchorEl(anchorEl ? null : event.currentTarget);
  // };

  // const open = Boolean(anchorEl);

  // const idd = open ? 'simple-popper' : undefined;

  // const handleMenuClose = () => {
  //   setAnchorEl(null);
  // };

  // const handleAddLink = () => {
  //   const editor = quillRef.current?.getEditor();

  //   if (savedRange) {
  //     editor.setSelection(savedRange); // Restore the saved selection
  //     editor.format('link', url); // Apply the link formatting
  //   }

  //   // handleMenuClose(); // Close the Popper
  // };

  return (
    <StyledEditorToolbar {...other}>
      <div id={id}>
        <div className="ql-formats">
          <select className="ql-header" defaultValue="">
            {HEADINGS.map((heading, index) => (
              <option key={heading} value={index + 1}>
                {heading}
              </option>
            ))}
            <option value="">Normal</option>
          </select>
        </div>

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mr: 0.5,
          }}
        />

        <div className="ql-formats">
          <button type="button" className="ql-bold" />
          <button type="button" className="ql-italic" />
          <button type="button" className="ql-underline" />
          <button type="button" className="ql-strike" />
        </div>

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mr: 0.5,
          }}
        />

        {!simple && (
          <div className="ql-formats">
            <select className="ql-color" />
            <select className="ql-background" />
          </div>
        )}

        {/* <div className="ql-formats">
          <button type="button" className="ql-list" value="ordered" />
          <button type="button" className="ql-list" value="bullet" />
          {!simple && <button type="button" className="ql-indent" value="-1" />}
          {!simple && <button type="button" className="ql-indent" value="+1" />}
        </div> */}

        {/* <Divider
          orientation="vertical"
          flexItem
          sx={{
            mr: 2,
          }}
        /> */}

        {/* {!simple && (
          <div className="ql-formats">
            <button type="button" className="ql-script" value="super" />
            <button type="button" className="ql-script" value="sub" />
          </div>
        )}

        {!simple && (
          <div className="ql-formats">
            <button type="button" className="ql-code-block" />
            <button type="button" className="ql-blockquote" />
          </div>
        )} */}

        <div className="ql-formats">
          <button type="button" className="ql-direction" value="rtl" />
          <select className="ql-align" />
        </div>

        {/* <Divider
          orientation="vertical"
          flexItem
          sx={{
            mr: 2,
          }}
        /> */}
        {/* <div className="ql-formats">
          <button type="button" className="ql-link" />
          <button type="button" className="ql-image" />
          <button type="button" className="ql-video" />
        </div> */}
{/* 
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mr: 2,
          }}
        /> */}

        {/* <div className="ql-formats">
          {!simple && <button type="button" className="ql-formula" />}
          <button type="button" className="ql-clean" />
        </div> */}

        {/* <Divider
          orientation="vertical"
          flexItem
          sx={{
            mr: 2,
          }}
        /> */}
      </div>

      {/* <Popover
        id={idd}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        onClose={handleMenuClose}
      >
        <Box
          sx={{
            p: 1,
          }}
        >
          <Stack spacing={1}>
            <TextField
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              label="Enter URL"
              variant="outlined"
              size="small"
              fullWidth
            />
            <Button variant="contained" fullWidth onClick={handleAddLink}>
              Apply
            </Button>
          </Stack>
        </Box>
      </Popover> */}
    </StyledEditorToolbar>
  );
}

Toolbar.propTypes = {
  id: PropTypes.string,
  simple: PropTypes.bool,
  quillRef: PropTypes.any,
  savedRange: PropTypes.string,
};
