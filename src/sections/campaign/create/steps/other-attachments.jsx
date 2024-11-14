import React, { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { RHFUpload } from 'src/components/hook-form';

const OtherAttachments = () => {
  const { setValue, watch } = useFormContext();
  const values = watch();

  const handleDropMultiFile = useCallback(
    (acceptedFiles) => {
      const files = values.otherAttachments || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('otherAttachments', [...files, ...newFiles]);
    },
    [setValue, values.otherAttachments]
  );

  return (
    <RHFUpload
      name="otherAttachments"
      multiple
      type="otherAttachment"
      onDrop={handleDropMultiFile}
      onRemove={(inputFile) =>
        setValue(
          'otherAttachments',
          values.otherAttachments && values.otherAttachments?.filter((file) => file !== inputFile),
          { shouldValidate: true }
        )
      }
      onRemoveAll={() => setValue('otherAttachments', [], { shouldValidate: true })}
    />
  );
};

export default OtherAttachments;
