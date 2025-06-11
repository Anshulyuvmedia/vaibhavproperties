import * as Yup from 'yup';

export const SignUpSchema = Yup.object().shape({
  contactName: Yup.string()
  .label('ContactName')
  .required('Please enter a registered Name'),
  contactNumber: Yup.string()
  .label('ContactNumber')
  .required('Please enter a registered Mobile Number'),
  email: Yup.string()
  .email('Enter Valid Email')
  .label('email'),
  password: Yup.string()
  .label('Password')
  .required('Password is Short')
  .min(6, 'Seems a bit short...')
})