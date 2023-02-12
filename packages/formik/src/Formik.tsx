import * as React from 'react';
import isEqual from 'react-fast-compare';
import invariant from 'tiny-warning';
import { useFormik } from '../dist';
import { FormikProvider } from './contexts/FormikContext';
import {
  FormikConfig,
  FormikErrors,
  FormikProps,
  FormikState,
  FormikTouched,
  FormikValues
} from './types';
import {
  isEmptyChildren,
  isFunction,
  setIn,
  setNestedObjectValues
} from './utils';

export type FormikMessage<Values> =
  | { type: 'SUBMIT_ATTEMPT' }
  | { type: 'SUBMIT_FAILURE' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SET_ISVALIDATING'; payload: boolean }
  | { type: 'SET_ISSUBMITTING'; payload: boolean }
  | { type: 'SET_VALUES'; payload: Values }
  | { type: 'SET_FIELD_VALUE'; payload: { field: string; value?: any } }
  | { type: 'SET_FIELD_TOUCHED'; payload: { field: string; value?: boolean } }
  | { type: 'SET_FIELD_ERROR'; payload: { field: string; value?: string } }
  | { type: 'SET_TOUCHED'; payload: FormikTouched<Values> }
  | { type: 'SET_ERRORS'; payload: FormikErrors<Values> }
  | { type: 'SET_STATUS'; payload: any }
  | {
      type: 'SET_FORMIK_STATE';
      payload: (s: FormikState<Values>) => FormikState<Values>;
    }
  | {
      type: 'RESET_FORM';
      payload: FormikState<Values>;
    };

// State reducer
export function formikReducer<Values>(
  state: FormikState<Values>,
  msg: FormikMessage<Values>
) {
  switch (msg.type) {
    case 'SET_VALUES':
      return { ...state, values: msg.payload };
    case 'SET_TOUCHED':
      return { ...state, touched: msg.payload };
    case 'SET_ERRORS':
      if (isEqual(state.errors, msg.payload)) {
        return state;
      }

      return { ...state, errors: msg.payload };
    case 'SET_STATUS':
      return { ...state, status: msg.payload };
    case 'SET_ISSUBMITTING':
      return { ...state, isSubmitting: msg.payload };
    case 'SET_ISVALIDATING':
      return { ...state, isValidating: msg.payload };
    case 'SET_FIELD_VALUE':
      return {
        ...state,
        values: setIn(state.values, msg.payload.field, msg.payload.value),
      };
    case 'SET_FIELD_TOUCHED':
      return {
        ...state,
        touched: setIn(state.touched, msg.payload.field, msg.payload.value),
      };
    case 'SET_FIELD_ERROR':
      return {
        ...state,
        errors: setIn(state.errors, msg.payload.field, msg.payload.value),
      };
    case 'RESET_FORM':
      return { ...state, ...msg.payload };
    case 'SET_FORMIK_STATE':
      return msg.payload(state);
    case 'SUBMIT_ATTEMPT':
      return {
        ...state,
        touched: setNestedObjectValues<FormikTouched<Values>>(
          state.values,
          true
        ),
        isSubmitting: true,
        submitCount: state.submitCount + 1,
      };
    case 'SUBMIT_FAILURE':
      return {
        ...state,
        isSubmitting: false,
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
      };
    default:
      return state;
  }
}


// This is an object that contains a map of all registered fields
// and their validate functions


export function Formik<
  Values extends FormikValues = FormikValues,
  ExtraProps = {}
>(props: FormikConfig<Values> & ExtraProps) {
  const formikbag = useFormik<Values>(props);
  const { component, children, render, innerRef } = props;

  // This allows folks to pass a ref to <Formik />
  React.useImperativeHandle(innerRef, () => formikbag);

  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      invariant(
        !props.render,
        `<Formik render> has been deprecated and will be removed in future versions of Formik. Please use a child callback function instead. To get rid of this warning, replace <Formik render={(props) => ...} /> with <Formik>{(props) => ...}</Formik>`
      );
      // eslint-disable-next-line
    }, []);
  }
  return (
    <FormikProvider value={formikbag}>
      {component
        ? React.createElement(component as any, formikbag)
        : render
        ? render(formikbag)
        : children // children come last, always called
        ? isFunction(children)
          ? (children as (bag: FormikProps<Values>) => React.ReactNode)(
              formikbag as FormikProps<Values>
            )
          : !isEmptyChildren(children)
          ? React.Children.only(children)
          : null
        : null}
    </FormikProvider>
  );
}
