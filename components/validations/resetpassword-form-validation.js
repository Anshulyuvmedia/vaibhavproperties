import * as Yup from 'yup';

export const ResetPasswordSchema = Yup.object().shape({
   mobilenumber: Yup.string()
  .label('MobileNumber')
  .required('Please enter a registered Mobile Number'),
})