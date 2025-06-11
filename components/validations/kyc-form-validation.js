import * as Yup from 'yup';

export const KycValidationSchema = Yup.object().shape({
    fullname: Yup.string()
        .label('FullName')
        .required('Please enter a Contact Full Name'),
    city:Yup.string()
        .label('City')
        .required("Please enter a City Name"),
    pincode:Yup.number()
        .label('pincode')
        .required("Please enter area Pin"),
    pannumber:Yup.number()
        .label('pincode')
        .required("Please enter area Pin"),
    aadharcardnumber:Yup.number()
        .label('AadharCardNumber')
        .required("Please enter AadharCardNumber")
})