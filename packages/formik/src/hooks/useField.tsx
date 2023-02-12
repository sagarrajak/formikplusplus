import { isObject } from 'lodash';
import React from 'react'
import { FieldHookConfig } from '../Field';
import { useFormikContext } from '../contexts/FormikContext';
import { FieldInputProps, FieldMetaProps, FieldHelperProps } from '../types';
import invariant from 'tiny-warning';

export function useField<Val = any>(
    propsOrFieldName: string | FieldHookConfig<Val>
  ): [FieldInputProps<Val>, FieldMetaProps<Val>, FieldHelperProps<Val>] {
    const formik = useFormikContext();
    const {
      getFieldProps,
      getFieldMeta,
      getFieldHelpers,
      registerField,
      unregisterField,
    } = formik;
  
    const isAnObject = isObject(propsOrFieldName);
  
    // Normalize propsOrFieldName to FieldHookConfig<Val>
    const props: FieldHookConfig<Val> = isAnObject
      ? (propsOrFieldName as FieldHookConfig<Val>)
      : { name: propsOrFieldName as string };
  
    const { name: fieldName, validate: validateFn } = props;
  
    React.useEffect(() => {
      if (fieldName) {
        registerField(fieldName, {
          validate: validateFn,
        });
      }
      return () => {
        if (fieldName) {
          unregisterField(fieldName);
        }
      };
    }, [registerField, unregisterField, fieldName, validateFn]);
  
    if (__DEV__) {
      invariant(
        formik,
        'useField() / <Field /> must be used underneath a <Formik> component or withFormik() higher order component'
      );
    }
  
    invariant(
      fieldName,
      'Invalid field name. Either pass `useField` a string or an object containing a `name` key.'
    );
  
    return [
      getFieldProps(props),
      getFieldMeta(fieldName),
      getFieldHelpers(fieldName),
    ];
  }