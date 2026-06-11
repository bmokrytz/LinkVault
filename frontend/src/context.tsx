import { createContext } from 'react';
import type { User, Bookmark } from './lib/types/index';

type VerificationContextType = {
    email: string;
    setLoginEmail: React.Dispatch<React.SetStateAction<string>>;
    setVerified: React.Dispatch<React.SetStateAction<boolean>>;
    verificationToken: string;
    setVerificationToken: React.Dispatch<React.SetStateAction<string>>;
};

export const VerificationContext = createContext<VerificationContextType>({email: "", setLoginEmail: () => {}, setVerified: () => {}, verificationToken: "", setVerificationToken: () => {}});

type TitleContextType = {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

export const TitleContext = createContext<TitleContextType>({setTitle: () => {}});

type UserContextType = {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const UserContext = createContext<UserContextType>({user: null, setUser: () => {}});


type MessageContextType = {
    message: string;
    update: React.Dispatch<React.SetStateAction<string>>;
};

export const MessageContext = createContext<MessageContextType>({message: "", update: () => {}});


export type ErrorTextContextType = {
    errorText: string;
    setErrorText: React.Dispatch<React.SetStateAction<string>>;
    showErrorText: boolean;
    setShowErrorText: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ErrorTextContext = createContext<ErrorTextContextType>({errorText: "", setErrorText: () => {}, showErrorText: false, setShowErrorText: () => {}});



type LinkCreatorContextType = {
    showLinkCreator: boolean;
    setShowLinkCreator: React.Dispatch<React.SetStateAction<boolean>>;
}

export const LinkCreatorContext = createContext<LinkCreatorContextType>({showLinkCreator: false, setShowLinkCreator: () => {}});

type FolderMapContextType = {
    folderMap: Record<string, Array<Bookmark>>;
    setFolderMap: React.Dispatch<React.SetStateAction<Record<string, Array<Bookmark>>>>;
};

export const FolderMapContext = createContext<FolderMapContextType>({folderMap: {}, setFolderMap: () => {}});

type FolderEditContextType = {
    edit: boolean;
    setEdit: React.Dispatch<React.SetStateAction<boolean>>;
};

export const FolderEditContext = createContext<FolderEditContextType>({edit: false, setEdit: () => {}});
