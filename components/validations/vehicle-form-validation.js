import * as Yup from 'yup';

export const VehicleValidationSchema = Yup.object().shape({
    vehiclenumber: Yup.string()
        .label('VehicleNumber')
        .required('Please enter a Vehicle Number'),
    VehicleNumber: Yup.string()
        .label('VehicleType')
        .required('Please enter a Vehicle Type'),
    modelnumber: Yup.string()
        .label('ModelNumber')
        .required('Please enter a Model Number'),
    chassisnumber: Yup.string()
        .label('ChassisNumber')
        .required('Please enter a Chassis Number'),
    engineno: Yup.string()
        .label('EngineNo')
        .required('Please enter a Engine No'),
    loadcapacity: Yup.string()
        .label('LoadCapacity')
        .required('Please enter a Load Capacity'),
    ownername: Yup.string()
        .label('OwnerName')
        .required('Please enter a Owner Name'),
    ownercontactnumber: Yup.string()
        .label('OwnerContactNumber')
        .required('Please enter a Owner Contact Number'),
    pannumber: Yup.string()
        .label('PanNumber')
        .required('Please enter a Pan Number'),
    rcnumber: Yup.string()
        .label('RcNumber')
        .required('Please enter a Rc Number'),
    nationpermitnumber: Yup.string()
        .label('NationPermitNumber')
        .required('Please enter a Nation Permit Number'),
    insurancenumber: Yup.string()
        .label('InsuranceNumber')
        .required('Please enter a Insurance Number'),
    fitnessnumber: Yup.string()
        .label('FitnessNumber')
        .required('Please enter a Fitness Number'),
})