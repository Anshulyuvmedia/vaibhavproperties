import * as Yup from 'yup';

export const LoadValidationSchema = Yup.object().shape({
  username: Yup.string()
  .label('Username')
  .required('Please enter a registered username'),
password: Yup.string()
  .label('Password')
  .required()
  .min(4, 'Password must have at least 4 characters ')
})