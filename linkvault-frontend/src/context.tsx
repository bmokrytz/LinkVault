import { createContext } from 'react';
import type { User } from './lib/types/index';

export const UserContext = createContext<User | null>(null);


type MessageContextType = {
    message: string;
    update: React.Dispatch<React.SetStateAction<string>>;
};

export const MessageContext = createContext<MessageContextType>({message: "", update: () => {}});


export type ErrorTextContextType = {
    errorText: string;
    updateErrorText: React.Dispatch<React.SetStateAction<string>>;
    showErrorText: boolean;
    updateShowErrorText: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ErrorTextContext = createContext<ErrorTextContextType>({errorText: "", updateErrorText: () => {}, showErrorText: false, updateShowErrorText: () => {}});