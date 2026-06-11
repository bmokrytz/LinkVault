import { useState, useContext } from "react";
import { UserContext, FolderMapContext, FolderEditContext } from "../../context";
import { Link } from "./link";
import { updateFolderTitle } from "../../lib/api/bookmarks";
import type { Bookmark } from "../../lib/types";

type FolderProps = {
    name: string;
    links: Array<Bookmark>;
};

export function Folder({ folderData }: { folderData: FolderProps }) {
    const [edit, setEdit] = useState<boolean>(false);
    const [titleEdit, setTitleEdit] = useState<boolean>(false);
    const [titleInput, setTitleInput] = useState<string>(folderData.name);
    const [titleEditAcceptButtonDisabled, setTitleEditAcceptButtonDisabled] = useState<boolean>(false);
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const folderMapContext = useContext(FolderMapContext);

    function openLinksHandler(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        e.stopPropagation();
        if (e.button == 2) return;
        const folder = folderData.name === "Links" ? "uncategorized" : folderData.name;
        const urls = folderMapContext.folderMap[folder]?.map(link => link.url) ?? [];
        urls.forEach((url) => {
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            window.open(url, "_blank");
        });
    }

    return (
        <div className="folder-card">
            <div className="folder-card-header-container">
                <div className="folder-card-title-container">
                    {folderData.name === "Links"
                    ? <span className="folder-card-title">{folderData.name} ({folderData.links.length})</span>
                    : <span className="folder-card-title">📁 {folderData.name} ({folderData.links.length})</span>}
                    {folderData.name !== "Links" ? <TitleEdit titleEdit={titleEdit} setTitleEdit={setTitleEdit} titleInput={titleInput} 
                        setTitleInput={setTitleInput} edit={edit} setEdit={setEdit}
                        titleEditAcceptButtonDisabled={titleEditAcceptButtonDisabled} setTitleEditAcceptButtonDisabled={setTitleEditAcceptButtonDisabled}
                        folderData={folderData} /> : null}
                </div>
                <div className="folder-card-header-buttons-container">
                    <button className="open-all-links-btn" onMouseDown={(e) => {openLinksHandler(e);}}>
                        <span className="open-all-links-span">Open All </span><span className="open-all-links-icon material-symbols-outlined">arrow_outward</span>
                    </button>
                    <button className="folder-card-settings-btn" onClick={() => {edit ? setEdit(false) : setEdit(true);}}>
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
            </div>
            <div className={collapsed ? "link-bin hidden" : "link-bin"}>
                <FolderEditContext value={{edit, setEdit}}>
                    {folderData.links.map(link => (
                        <Link key={link.id} folder={folderData.name} bookmark={link} />
                    ))}
                </FolderEditContext>
                
            </div>
            <DrawerHandle collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
    );
}

function DrawerHandle({collapsed, setCollapsed}: {collapsed: boolean, setCollapsed: React.Dispatch<React.SetStateAction<boolean>>}) {
    return (
        <div className="drawer-handle" onClick={() => {collapsed ? setCollapsed(false) : setCollapsed(true);}}>
            <p className={collapsed ? "drawer-arrow drawer-arrow-flipped" : "drawer-arrow"} >&#x25BE;</p>
        </div>
    );
}


type TitleEditProps = {
    titleEdit: boolean;
    setTitleEdit: React.Dispatch<React.SetStateAction<boolean>>;
    titleInput: string;
    setTitleInput: React.Dispatch<React.SetStateAction<string>>;
    edit: boolean;
    setEdit: React.Dispatch<React.SetStateAction<boolean>>;
    titleEditAcceptButtonDisabled: boolean;
    setTitleEditAcceptButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
    folderData: FolderProps;
};

function TitleEdit({
    titleEdit, setTitleEdit, 
    titleInput, setTitleInput, 
    edit, setEdit, 
    titleEditAcceptButtonDisabled, setTitleEditAcceptButtonDisabled, 
    folderData
}: TitleEditProps) {
    const userContext = useContext(UserContext);
    const folderMapContext = useContext(FolderMapContext);

    function titleEditButtonHandler(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        e.stopPropagation();
        titleEdit ? setTitleEdit(false) : setTitleEdit(true);
    }

    async function acceptCardTitleButtonHandler(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
        e.stopPropagation();
        setTitleEditAcceptButtonDisabled(true);
        setTitleEdit(false);
        setEdit(false);
        if (titleInput !== folderData.name) {
            if (await updateFolderTitle(userContext.user!.token, folderData.name, titleInput)) {
                folderMapContext.setFolderMap(prev => {
                    const { [folderData.name]: folderLinks, ...rest} = prev;
                    return { ...rest, [titleInput]: folderLinks };
                });
            }
        }
        setTitleEditAcceptButtonDisabled(false);
    }

    return (
        <>
            <form className={titleEdit ? "card-title-form" : "card-title-form hidden"}>
                <input className="card-title-form-input" value={titleInput} onChange={(e) => {setTitleInput(e.target.value)}}/>
            </form>
            <button className={edit ? "folder-title-edit-btn" : "folder-title-edit-btn hidden"} onClick={(e) => {titleEditButtonHandler(e);}}>
                <span className="material-symbols-outlined folder-title-edit-btn-icon">edit</span>
            </button>
            <button className={titleEdit ? "accept-card-title-btn" : "accept-card-title-btn hidden"} disabled={titleEditAcceptButtonDisabled} 
                onClick={async (e) => {acceptCardTitleButtonHandler(e);}}>
                <span className="material-symbols-outlined accept-card-title-icon">check</span>
            </button>
        </>
    );
}
