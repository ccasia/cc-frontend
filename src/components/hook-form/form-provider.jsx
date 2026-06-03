import PropTypes from 'prop-types';
import { FormProvider as Form } from 'react-hook-form';

// ----------------------------------------------------------------------

export default function FormProvider({ children, onSubmit, methods, id }) {
  return (
    <Form {...methods}>
      <form id={id} onSubmit={onSubmit}>
        {children}
      </form>
    </Form>
  );
}

FormProvider.propTypes = {
  children: PropTypes.node,
  methods: PropTypes.object,
  onSubmit: PropTypes.func,
  id: PropTypes.string,
};
