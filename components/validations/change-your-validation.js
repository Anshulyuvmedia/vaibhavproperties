import * as Yup from 'yup';

export const ChangeYourValidationSchema = Yup.object().shape({
  newPassword: Yup.string()
  .label('NewPassword')
  .oneOf([Yup.ref('confirmPassword')], 'Confirm Password must matched Password')
  .required(),
  confirmPassword: Yup.string()
  .label('ConfirmPassword')
  .oneOf([Yup.ref('newPassword')], 'Confirm Password must matched Password')
  .required('Confirm Password is required')
})