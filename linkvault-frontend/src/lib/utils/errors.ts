import type { ErrorTextContextType } from "../../context";

export function showError(message: string, errorTextContext: ErrorTextContextType) {
    errorTextContext.updateErrorText(message);
    errorTextContext.updateShowErrorText(true);
}

export function hideError(errorTextContext: ErrorTextContextType) {
    errorTextContext.updateErrorText("");
    errorTextContext.updateShowErrorText(false);
}
