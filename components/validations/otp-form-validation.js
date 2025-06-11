import * as Yup from 'yup';

export const OtpFormSchema = Yup.object().shape({
   otp: Yup.string()
  .label('Otp')
  .required('Please enter OTP number sending In register mobile number'),
})