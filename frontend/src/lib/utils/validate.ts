import type { RegistrationFormInputValues } from "../../pages/register/Register";
import type { LoginFormInputValues } from "../../pages/login/Login";

function isRegistrationFormInputValues(obj: any): obj is RegistrationFormInputValues {
    return obj && typeof obj.password_conf === 'string'
}

export function validateFormFields(inputValues: RegistrationFormInputValues | LoginFormInputValues): string | null {
    if (!validateFieldsNotEmpty(Object.values(inputValues))) return "Enter all form fields *";
    if (!validateEmailShape(inputValues.email)) return "Enter a valid email address";
    if (!validatePasswordLength(inputValues.password)) return "Password must be at least 8 characters long";
    if (isRegistrationFormInputValues(inputValues)) {
        if (!validatePasswordsMatch(inputValues.password, inputValues.password_conf)) return "Password fields do not match";
    }
    return null;
}

function validateFieldsNotEmpty(fieldsArray: Array<string>): boolean {
    return fieldsArray.every(field => !!field)
}

function validateEmailShape(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordLength(password: string): boolean {
    return password.length >= 8;
}

function validatePasswordsMatch(password: string, conf_password: string): boolean {
    return password === conf_password;
}

export function isVerificationTokenPayload(obj: any): boolean {
    return obj && typeof obj.verification_email_token === "string" && typeof obj.error === "string";
}
