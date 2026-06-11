import { useState, useContext, useEffect } from "react";
import { FolderEditContext, FolderMapContext, UserContext } from "../../context";
import { Option } from "../../components";
import { deleteLink, editLink } from "../../lib/api/bookmarks";
import type { Bookmark } from "../../lib/types";

export function Link({ folder, bookmark }: {folder: string, bookmark: Bookmark}) {
    const link = bookmark;
    const [edit, setEdit] = useState<boolean>(false);
    const [title, setTitle] = useState<string>(bookmark.title);
    const [url, setURL] = useState<string>(bookmark.url);
    const [tagsString, setTagsString] = useState<string>(bookmark.tags.filter(tag => !tag.startsWith('folder:')).join(","));
    const [tagsArray, setTagsArray] = useState<Array<string>>(bookmark.tags.filter(tag => !tag.startsWith('folder:')));
    const folderName = folder;
    const folderEditContext = useContext(FolderEditContext);

    useEffect(() => {
        setTitle(link.title);
        setURL(link.url);
        setTagsString(link.tags.filter(tag => !tag.startsWith('folder:')).join(","));
        setTagsArray(link.tags.filter(tag => !tag.startsWith('folder:')));
    }, [link]);

    useEffect(() => {
        !folderEditContext.edit ? setEdit(false) : null;
    }, [folderEditContext.edit]);

    function openLink(link: string, e: React.MouseEvent<HTMLDivElement, MouseEvent>): void {
        if (folderEditContext.edit || e.button === 2) return;
        let url = link;
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        window.open(url, "_blank");
    }

    function editLinkButtonHandler(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        e.stopPropagation();
        edit ? setEdit(false) : setEdit(true);
    }

    function clickThroughHandler(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void {
        if ((e.target as HTMLElement).closest(".link-expander")) return;
        openLink(url, e);
    }

    return (
        <div className={folderEditContext.edit ? "link-outer-container" : "link-outer-container blue-outline-hover"} onMouseDown={(e) => {clickThroughHandler(e);}}>
            <LinkContainer edit={edit} title={title} url={url} tagsArray={tagsArray} />
            
                <LinkEdit link={link} edit={edit} title={title} setTitle={setTitle}
                        url={url} setURL={setURL} tagsString={tagsString} setTagsString={setTagsString}
                        folderName={folderName} prevFolderEditValue={folderName === "Links" ? "0" : folderName} />

            <div className={folderEditContext.edit
                ? "link-buttons-container"
                : "link-buttons-container hidden"
            }>
                <button className="edit-link-btn" onMouseDown={(e) => {editLinkButtonHandler(e);}}>
                    <span className="material-symbols-outlined">edit</span>
                </button>
                <Delete link={link} />
            </div>
        </div>
    );
}

function LinkContainer({edit, title, url, tagsArray}: {edit: boolean, title: string, url: string, tagsArray: Array<string>}) {
    const [expanded, setExpanded] = useState<boolean>(false);

    function linkExpanderHandler(e: React.MouseEvent<HTMLSpanElement, MouseEvent>): void {
        e.stopPropagation();
        if (e.button !== 0) return;
        expanded ? setExpanded(false) : setExpanded(true);
    }

    return (
        <>
            <div className={expanded 
                                ? edit ?
                                    "link-container-expanded hidden" : "link-container-expanded"
                                : edit ?
                                    "link-container hidden" : "link-container"
            }>
                <span className={expanded ? "link-title-expanded" : "link-title"}>{title}</span>
                <div className={expanded ? "link-container-right-expanded" : "link-container-right"}>
                    <span className={expanded ? "link-url-expanded" : "link-url"}>{url}</span>
                    <div className={expanded ? "tags-container-expanded" : "tags-container"}>
                        {tagsArray.map((tag, index) => (
                            <Tag key={index} tag={tag}/>
                        ))}
                    </div>
                    <span className={expanded ? "link-expander expanded" : "link-expander"} onMouseDown={(e) => {linkExpanderHandler(e);}}>
                        &#x276F;
                    </span>
                </div>
            </div>
        </>
    );
}

type LinkEditProps = {
    link: Bookmark | null;
    edit: boolean;
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    url: string;
    setURL: React.Dispatch<React.SetStateAction<string>>;
    tagsString: string;
    setTagsString: React.Dispatch<React.SetStateAction<string>>;
    folderName: string;
    prevFolderEditValue: string;
};

function LinkEdit({
    link, edit,
    title, setTitle,
    url, setURL, tagsString,
    setTagsString,
    folderName, prevFolderEditValue}: LinkEditProps) {
    const folderMapContext = useContext(FolderMapContext);
    const folderEditContext = useContext(FolderEditContext);
    const userContext = useContext(UserContext);
    const [editTitle, setEditTitle] = useState<string>(title);
    const [editURL, setEditURL] = useState<string>(url);
    const [editTags, setEditTags] = useState<string>(tagsString);
    const [newFolderName, setNewFolderName] = useState<string>("");
    const [newFolderInputDisabled, setNewFolderInputDisabled] = useState<boolean>(true);
    const [folderEditValue, setFolderEditValue] = useState<string>(folderName === "Links" ? "0" : folderName);

    async function clickHandler() {
        const newToken = userContext.user!.token;
        const newLinkId = link!.id;
        const newTitle = editTitle !== title ? editTitle : undefined;
        const newURL = editURL !== url ? editURL : undefined;
        
        const newFolderTag = getNewFolderTag();
        const tags = buildTagsString(newFolderTag);
        
        if (newTitle || newURL || tags) {
            await handleEditLink(newLinkId, newToken, newFolderTag, newTitle, newURL, tags);
        }
        folderEditContext.setEdit(false);
    }

    async function handleEditLink(newLinkId: string, newToken: string, newFolderTag: string | undefined, 
        newTitle: string | undefined, newURL: string | undefined, tags: string | undefined): Promise<void> {
        const updatedBookmark = await editLink(newLinkId, newToken, newTitle, newURL, tags);
        if (updatedBookmark) {
            if (newFolderTag) {
                const oldFolderKey = folderName === "Links" ? "uncategorized" : folderName;
                const newFolderKey = newFolderTag.replace("folder:", "") ?? "uncategorized";

                folderMapContext.setFolderMap(prev => {
                    const oldFolderLinks = prev[oldFolderKey]?.filter(l => l.id !== newLinkId) ?? [];
                    const newFolderLinks = prev[newFolderKey] 
                        ? [...prev[newFolderKey].filter(l => l.id !== newLinkId), updatedBookmark]
                        : [updatedBookmark];

                    const updated = { ...prev, [oldFolderKey]: oldFolderLinks, [newFolderKey]: newFolderLinks };
                    if (updated[oldFolderKey].length === 0 && oldFolderKey !== newFolderKey) {
                        const { [oldFolderKey]: _, ...rest } = updated;
                        return rest;
                    }
                    return updated;
                });
            } else {
                const newFolderName = folderName === "Links" ? "uncategorized" : folderName;
                folderMapContext.setFolderMap(prev => ({...prev, 
                    [newFolderName!]: prev[newFolderName!].map(link => link.id === newLinkId ? updatedBookmark : link)
                }));
            }
            
            setTitle(updatedBookmark.title);
            setURL(updatedBookmark.url);
            setTagsString(updatedBookmark.tags.join(","));
        } else {
            alert("Internal server error");
        }
    }

    function getNewFolderTag(): string | undefined {
        let newFolderTag: string | undefined;
        if (folderEditValue !== prevFolderEditValue) {
            if (folderEditValue === "0") {
                newFolderTag = "folder:uncategorized"
            } else {
                if (folderEditValue === "1") {
                    if (newFolderName !== "") {
                        newFolderTag = `folder:${newFolderName}`;
                    }
                } else {
                    newFolderTag = `folder:${folderEditValue}`;
                }
            }
        } else {
            newFolderTag = undefined;
        }
        return newFolderTag;
    }

    function buildTagsString(newFolderTag: string | undefined): string | undefined {
        let tags: string | undefined;
        if (newFolderTag) {
            tags = editTags !== tagsString ? [editTags, newFolderTag].join(",") : newFolderTag
        } else {
            tags = editTags !== tagsString ? editTags : undefined;
        }
        return tags
    }

    return (
        <div className={edit
            ? "link-edit-form-container"
            : "link-edit-form-container hidden"
        }>
            <form className="link-edit-form">
                <input className="edit-form-id" style={{display: "none"}}></input>
                <label>Link name:</label>
                <label>URL:</label>
                <label>Folder:</label>
                <label className="edit-form-new-folder-name-label">Folder name:</label>
                <label>Tags <span style={{fontSize: "15px"}}>(comma separated)</span>:</label>
                <input type="text" className="edit-form-title-input" onChange={(e) => {setEditTitle(e.target.value)}} value={editTitle}/>
                <input type="text" className="edit-form-url-input" onChange={(e) => {setEditURL(e.target.value)}} value={editURL}/>
                <select className="edit-form-folder-select" value={folderEditValue} onChange={(e) => {
                    setFolderEditValue(e.target.value);
                    e.target.value === "1" ? setNewFolderInputDisabled(false) : setNewFolderInputDisabled(true);
                }}>
                    <Option text='None' value='0' />
                    <Option text='Create new folder' value='1' />
                    {Object.keys(folderMapContext.folderMap).filter(folderName => folderName !== "uncategorized").map(folderName => (
                        <Option key={folderName} text={folderName} value={folderName} />
                    ))}
                </select>
                <input type="text" className="edit-form-new-folder-name-input" disabled={newFolderInputDisabled} onChange={(e) => {setNewFolderName(e.target.value)}} value={newFolderName}/>
                <input type="text" className="edit-form-tags-input" placeholder="tag1,tag2,tag3" onChange={(e) => {setEditTags(e.target.value)}} value={editTags}/>
            </form>
            <button className="material-symbols-outlined accept-card-title-btn" style={{height: "35px", alignSelf: "center", marginLeft: "10px"}} onClick={clickHandler}>
                <span className="material-symbols-outlined accept-card-title-icon">check</span>
            </button>
        </div>
    );
}

function Tag({ tag }: { tag: string }) {
    return (
        <div className="tag">
            <p>{tag}</p>
        </div>
    );
}

function Delete({link}: {link: Bookmark}) {
    const [disabled, setDisabled] = useState<boolean>(false);
    const userContext = useContext(UserContext);
    const folderMapContext = useContext(FolderMapContext);

    async function handleDelete(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        e.stopPropagation();
        if (!confirm("Are you sure you want to permanently delete this link?")) return;
        setDisabled(true);
        if (await deleteLink(userContext.user!.token, link.id)) {
            let folderName = link.tags.find(tag => tag.startsWith("folder:"))?.replace("folder:", "");
            if (folderName === undefined) {
                folderName = "uncategorized";
            }
            folderMapContext.setFolderMap(prev => {
                const updatedFolder = prev[folderName!].filter(b => b.id !== link.id);
                if (updatedFolder.length === 0) {
                    const { [folderName!]: _, ...rest } = prev;
                    return rest;
                }
                return { ...prev, [folderName!]: updatedFolder };
            });
        }
        setDisabled(false);
    }

    return (
        <button className="delete-link-btn" disabled={disabled} onClick={async (e) => {await handleDelete(e);}}>
            <span className="material-symbols-outlined">{disabled ? "..." : "delete"}</span>
        </button>
    );
}
