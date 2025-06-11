import * as Yup from 'yup';

export const  LoadValidationSchema = Yup.object().shape({
    contactName: Yup.string()
        .label('ContactName')
        .required('Please enter a Contact Username'),
    contactNumber: Yup.number()
        .label('ContactNumber')
        .required()
        .min(10, 'Enter Valid Mobile Number'),
    pickupLocation: Yup.string()
        .label('PickupLocation')
        .required('Please enter a Pickup Loaction'),
    destination: Yup.string()
        .label('Destination')
        .required('Please enter a Destination'),
    itemWeight: Yup.number()
        .label('Weight')
        .required('Please enter a weight')
})