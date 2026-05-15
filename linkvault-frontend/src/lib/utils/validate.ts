import type { RegistrationFormInputValues } from "../../pages/register/Register";

export function validateRegistrationFields(inputValues: RegistrationFormInputValues): string | null {
    if (!validateFieldsNotEmpty(Object.values(inputValues))) return "Enter all form fields *";
    if (!validateEmailShape(inputValues.email)) return "Enter a valid email address";
    if (!validatePasswordLength(inputValues.password)) return "Password must be at least 8 characters long";
    if (!validatePasswordsMatch(inputValues.password, inputValues.password_conf)) return "Password fields do not match";
    return null;
}

function validateFieldsNotEmpty(fieldsArray: Array<string>): boolean {
    fieldsArray.forEach((field) => {
        if (!field) {
            return false;
        }
    });
    return true;
}

function validateEmailShape(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) !== false;
}

function validatePasswordLength(password: string): boolean {
    return password.length >= 8;
}

function validatePasswordsMatch(password: string, conf_password: string): boolean {
    return password === conf_password;
}
