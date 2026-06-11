import type { ErrorTextContextType } from "../../context";

export function showError(message: string, errorTextContext: ErrorTextContextType) {
    errorTextContext.setErrorText(message);
    errorTextContext.setShowErrorText(true);
}

export function hideError(errorTextContext: ErrorTextContextType) {
    errorTextContext.setErrorText("");
    errorTextContext.setShowErrorText(false);
}
