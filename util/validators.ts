enum ValidatorConstant {
  Require,
  Length,
  MinLength,
  MaxLength,
  Min,
  Max,
  Email,
  Password,
  Equal,
}

export interface ValidatorAction {
  type: ValidatorConstant;
  payload?: string | number;
}

export const VALIDATOR_REQUIRE = (): ValidatorAction => ({
  type: ValidatorConstant.Require,
});
export const VALIDATOR_EMAIL = (): ValidatorAction => ({
  type: ValidatorConstant.Email,
});
export const VALIDATOR_PASSWORD = (): ValidatorAction => ({
  type: ValidatorConstant.Password,
});
export const VALIDATOR_EQUAL = (payload: string | number): ValidatorAction => ({
  type: ValidatorConstant.Equal,
  payload,
});
export const VALIDATOR_LENGTH = (payload: number): ValidatorAction => ({
  type: ValidatorConstant.Length,
  payload,
});
export const VALIDATOR_MINLENGTH = (payload: number): ValidatorAction => ({
  type: ValidatorConstant.MinLength,
  payload,
});
export const VALIDATOR_MAXLENGTH = (payload: number): ValidatorAction => ({
  type: ValidatorConstant.MaxLength,
  payload,
});
export const VALIDATOR_MIN = (payload: number): ValidatorAction => ({
  type: ValidatorConstant.Min,
  payload,
});
export const VALIDATOR_MAX = (payload: number): ValidatorAction => ({
  type: ValidatorConstant.Max,
  payload,
});

export const validate = (
  value: string,
  validators: ValidatorAction[]
): boolean => {
  let isValid = true;

  for (const validator of validators) {
    if (validator.type === ValidatorConstant.Require) {
      isValid = isValid && value.trim().length > 0;
    }

    if (validator.type === ValidatorConstant.Email) {
      isValid = isValid && /^\S+@\S+\.\S+$/.test(value.trim());
    }

    if (validator.type === ValidatorConstant.Password) {
      isValid =
        isValid &&
        /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/.test(
          value.trim()
        );
    }

    if (validator.type === ValidatorConstant.Equal) {
      isValid = isValid && value === validator.payload;
    }

    if (validator.type === ValidatorConstant.Length) {
      isValid = isValid && value.trim().length === validator.payload;
    }

    if (validator.type === ValidatorConstant.MinLength) {
      isValid = isValid && value.trim().length >= validator.payload!;
    }

    if (validator.type === ValidatorConstant.MaxLength) {
      isValid = isValid && value.trim().length <= validator.payload!;
    }

    if (validator.type === ValidatorConstant.Min) {
      isValid = isValid && +value >= validator.payload!;
    }

    if (validator.type === ValidatorConstant.Max) {
      isValid = isValid && +value <= validator.payload!;
    }
  }

  return isValid;
};
