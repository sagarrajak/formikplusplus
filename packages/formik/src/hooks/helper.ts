import deepmerge from 'deepmerge';
import { isPlainObject } from 'lodash';
import { FormikErrors, FormikValues } from '../types';
import { getIn, setIn } from '../utils';


export function warnAboutMissingIdentifier({
  htmlContent,
  documentationAnchorLink,
  handlerName,
}: {
  htmlContent: string;
  documentationAnchorLink: string;
  handlerName: string;
}) {
  console.warn(
    `Warning: Formik called \`${handlerName}\`, but you forgot to pass an \`id\` or \`name\` attribute to your input:
      ${htmlContent}
      Formik cannot determine which value to update. For more info see https://formik.org/docs/api/formik#${documentationAnchorLink}
    `
  );
}

/**
 * Transform Yup ValidationError to a more usable object
 */
export function yupToFormErrors<Values>(yupError: any): FormikErrors<Values> {
  let errors: FormikErrors<Values> = {};
  if (yupError.inner) {
    if (yupError.inner.length === 0) {
      return setIn(errors, yupError.path, yupError.message);
    }
    for (let err of yupError.inner) {
      if (!getIn(errors, err.path)) {
        errors = setIn(errors, err.path, err.message);
      }
    }
  }
  return errors;
}

/**
 * Validate a yup schema.
 */
export function validateYupSchema<T extends FormikValues>(
  values: T,
  schema: any,
  sync: boolean = false,
  context: any = {}
): Promise<Partial<T>> {
  const validateData: FormikValues = prepareDataForValidation(values);
  return schema[sync ? 'validateSync' : 'validate'](validateData, {
    abortEarly: false,
    context: context,
  });
}

/**
 * Recursively prepare values.
 */
export function prepareDataForValidation<T extends FormikValues>(
  values: T
): FormikValues {
  let data: FormikValues = Array.isArray(values) ? [] : {};
  for (let k in values) {
    if (Object.prototype.hasOwnProperty.call(values, k)) {
      const key = String(k);
      if (Array.isArray(values[key]) === true) {
        data[key] = values[key].map((value: any) => {
          if (Array.isArray(value) === true || isPlainObject(value)) {
            return prepareDataForValidation(value);
          } else {
            return value !== '' ? value : undefined;
          }
        });
      } else if (isPlainObject(values[key])) {
        data[key] = prepareDataForValidation(values[key]);
      } else {
        data[key] = values[key] !== '' ? values[key] : undefined;
      }
    }
  }
  return data;
}

/**
 * deepmerge array merging algorithm
 * https://github.com/KyleAMathews/deepmerge#combine-array
 */
export function arrayMerge(target: any[], source: any[], options: any): any[] {
  const destination = target.slice();

  source.forEach(function merge(e: any, i: number) {
    if (typeof destination[i] === 'undefined') {
      const cloneRequested = options.clone !== false;
      const shouldClone = cloneRequested && options.isMergeableObject(e);
      destination[i] = shouldClone
        ? deepmerge(Array.isArray(e) ? [] : {}, e, options)
        : e;
    } else if (options.isMergeableObject(e)) {
      destination[i] = deepmerge(target[i], e, options);
    } else if (target.indexOf(e) === -1) {
      destination.push(e);
    }
  });
  return destination;
}

/** Return multi select values based on an array of options */
export function getSelectedValues(options: any[]) {
  return Array.from(options)
    .filter(el => el.selected)
    .map(el => el.value);
}

/** Return the next value for a checkbox */
export function getValueForCheckbox(
  currentValue: string | any[],
  checked: boolean,
  valueProp: any
) {
  // If the current value was a boolean, return a boolean
  if (typeof currentValue === 'boolean') {
    return Boolean(checked);
  }

  // If the currentValue was not a boolean we want to return an array
  let currentArrayOfValues = [];
  let isValueInArray = false;
  let index = -1;

  if (!Array.isArray(currentValue)) {
    // eslint-disable-next-line eqeqeq
    if (!valueProp || valueProp == 'true' || valueProp == 'false') {
      return Boolean(checked);
    }
  } else {
    // If the current value is already an array, use it
    currentArrayOfValues = currentValue;
    index = currentValue.indexOf(valueProp);
    isValueInArray = index >= 0;
  }

  // If the checkbox was checked and the value is not already present in the aray we want to add the new value to the array of values
  if (checked && valueProp && !isValueInArray) {
    return currentArrayOfValues.concat(valueProp);
  }

  // If the checkbox was unchecked and the value is not in the array, simply return the already existing array of values
  if (!isValueInArray) {
    return currentArrayOfValues;
  }

  // If the checkbox was unchecked and the value is in the array, remove the value and return the array
  return currentArrayOfValues
    .slice(0, index)
    .concat(currentArrayOfValues.slice(index + 1));
}

// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect in the browser.
// @see https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85