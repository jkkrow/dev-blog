import { useEffect, useMemo, useReducer, useRef } from 'react';

import { validate, ValidatorAction } from 'lib/validators';
import classes from './index.module.scss';

interface State {
  value: string;
  isValid: boolean;
  isBlured: boolean;
}

type Action =
  | { type: 'CHANGE'; value: string; validators: ValidatorAction[] }
  | { type: 'BLUR' }
  | { type: 'INITIAL' };

const inputReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'CHANGE':
      return {
        ...state,
        value: action.value,
        isValid: validate(action.value, action.validators),
      };

    case 'BLUR':
      return {
        ...state,
        isBlured: true,
      };

    case 'INITIAL': {
      return {
        value: '',
        isValid: false,
        isBlured: false,
      };
    }

    default:
      return state;
  }
};

interface InputProps {
  id: string;
  type?: string;
  textarea?: boolean;
  validators: ValidatorAction[];
  submitted: boolean;
  onForm: (id: string, value: string, isValid: boolean) => void;
}

const Input: React.FC<InputProps> = ({
  id,
  type = 'text',
  textarea,
  validators,
  submitted,
  onForm,
}) => {
  const [inputState, dispatch] = useReducer(inputReducer, {
    value: '',
    isValid: false,
    isBlured: false,
  });

  const inputRef = useRef<any>(null);

  useEffect(() => {
    onForm(id, inputState.value, inputState.isValid);
  }, [onForm, id, inputState]);

  useEffect(() => {
    if (!submitted) return;
    inputRef.current && inputRef.current.blur();
    dispatch({ type: 'INITIAL' });
  }, [submitted]);

  const changeHandler = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    dispatch({
      type: 'CHANGE',
      value: event.target.value,
      validators,
    });
  };

  const blurHandler = () => {
    dispatch({ type: 'BLUR' });
  };

  const inputClasses = useMemo(
    () =>
      !inputState.isValid && inputState.isBlured
        ? [classes.input, classes.invalid].join(' ')
        : classes.input,
    [inputState]
  );

  const element = !textarea ? (
    <input
      ref={inputRef}
      id={id}
      type={type}
      autoComplete="off"
      value={inputState.value}
      onChange={changeHandler}
      onBlur={blurHandler}
    />
  ) : (
    <textarea
      ref={inputRef}
      id={id}
      rows={5}
      value={inputState.value}
      onChange={changeHandler}
      onBlur={blurHandler}
    />
  );

  return (
    <div className={inputClasses}>
      {element}
      <label htmlFor={id}>{id}</label>
    </div>
  );
};

export default Input;
