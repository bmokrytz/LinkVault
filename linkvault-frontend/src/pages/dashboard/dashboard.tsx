import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { UserContext, TitleContext, LinkCreatorContext,FolderMapContext } from '../../context';
import { Option } from '../../components';
import { Folder } from "./folder";
import { fetchLinks, createLink } from '../../lib/api/bookmarks';
import type { Bookmark } from '../../lib/types';
import './Dashboard.css'

function Dashboard() {
    const navigate = useNavigate();
    const userContext = useContext(UserContext);
    const titleContext = useContext(TitleContext);
    const [showLinkCreator, setShowLinkCreator] = useState<boolean>(false);
    const [links, setLinks] = useState<Array<Bookmark>>([]);
    const [folderMap, setFolderMap] = useState<Record<string, Array<Bookmark>>>({});

    useEffect(() => {
        if (!userContext.user) { navigate("/"); return; }
        async function loadLinks() {
            const links = await fetchLinks(userContext.user!.token);
            setLinks(links);
        }
        loadLinks();
    }, []);

    useEffect(() => {
        const folderMap = links.reduce<Record<string, Array<Bookmark>>>((acc, link) => {
            const folderTag = link.tags.find(tag => tag.startsWith("folder:"));
            const folderName = folderTag ? folderTag.replace("folder:", "") : "uncategorized";
            if (!acc[folderName]) acc[folderName] = [];
            acc[folderName].push(link);
            return acc;
        }, {});
        setFolderMap(folderMap);
    }, [links]);

    useEffect(() => {
        titleContext.setTitle("LinkVault - Dashboard");
        
        if (!userContext.user) {
            navigate("/");
        }

    }, [userContext.user]);

    if (!userContext.user) return null;

    return (
        <>
            <HeaderBar/>
            <div className="content-container dashboard">

                <FolderMapContext value={{folderMap, setFolderMap}}>

                    <LinkCreatorContext value={{showLinkCreator, setShowLinkCreator}}>
                        <AddLinkButton/>
                        <AddLinkForm/>
                    </LinkCreatorContext>

                    {Object.entries(folderMap)
                        .sort(([a], [b]) => {
                            if (a === "uncategorized") return -1;
                            if (b === "uncategorized") return 1;
                            return a.localeCompare(b);
                        })
                        .map(([name, links]) => (
                            name === "uncategorized" 
                                ? <Folder key={name} folderData={{name: "Links", links}} /> 
                                : <Folder key={name} folderData={{name, links}} />
                        ))
                    }

                </FolderMapContext> 

            </div>
        </>
    )
}

export default Dashboard;

function AddLinkForm() {
    const [linkName, setLinkName] = useState<string>("");
    const [url, setURL] = useState<string>("");
    const [folderSelectValue, setFolderSelectValue] = useState<string>("0");
    const [tags, setTags] = useState<string>("");
    const [newFolderInputDisabled, setNewFolderInputDisabled] = useState<boolean>(true);
    const [newFolderName, setNewFolderName] = useState<string>("");
    const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);
    const linkCreatorContext = useContext(LinkCreatorContext);
    const userContext = useContext(UserContext);
    const folderMapContext = useContext(FolderMapContext);

    const containerClass = linkCreatorContext.showLinkCreator 
    ? "add-link-form-container" 
    : "add-link-form-container hidden";

    async function handleSubmit(e: React.MouseEvent<HTMLInputElement, MouseEvent>): Promise<void> {
        e.stopPropagation();
        setSubmitDisabled(true);
        const selected = folderSelectValue;
        let newTags = tags;
        if (selected === "1") {
            newTags = [tags, `folder:${newFolderName}`].join(",");
        } else {
            if (selected !== "0") {
                newTags = [tags, `folder:${selected}`].join(",");
            }
        }
        const tagsArray = newTags && newTags !== ","
            ? newTags.split(",").filter(tag => tag.trim() !== "")
            : null;
        const bookmark = await createLink(userContext.user!.token, url, linkName, tagsArray );
        if (bookmark) {
            const folderTag = bookmark.tags.find(tag => tag.startsWith("folder:"));
            const folderName = folderTag ? folderTag.replace("folder:", "") : "uncategorized";
            folderMapContext.setFolderMap(prev => ({...prev, [folderName!]: prev[folderName!] ? [...prev[folderName!], bookmark] : [bookmark] }));
        }
        linkCreatorContext.setShowLinkCreator(false);
        setSubmitDisabled(false);
    }

    return (
        <div className={containerClass}>
            <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                <p>Add link details</p>
            </div>
            <form className="add-link-form">
                <div style={{display: "flex", flexDirection: "row"}}>
                    <div className="form-input-container">
                        <label>Link name:</label>
                        <input type="text" name="link-name" onChange={(e) => {setLinkName(e.target.value)}}/>
                    </div>
                    <div className="form-input-container" style={{paddingLeft: "20px"}}>
                        <label>URL:</label>
                        <input type="text" name="link-url" placeholder='www.example.com' onChange={(e) => {setURL(e.target.value)}}/>
                    </div>
                    </div>
                    <div style={{display: "flex", flexDirection: "row", paddingBottom: "10px"}}>
                    <div className="form-input-container">
                        <label>Folder:</label>
                        <select className="folder-select" value={folderSelectValue} style={{width: "150px", height: "30px"}} onChange={(e) => {setFolderSelectValue(e.target.value); e.target.value === "1" ? setNewFolderInputDisabled(false) : setNewFolderInputDisabled(true);}}>
                        <Option text='None' value="0" />
                        <Option text='Create new folder' value="1" />
                        {Object.keys(folderMapContext.folderMap).filter(folder => folder !== "uncategorized").map((folderName) => (
                            <Option key={folderName} text={folderName} value={folderName} />
                        ))}
                        </select>
                    </div>
                    <div id="folder-creation-container" className="folder-creation-container">
                        <div id="folder-name-input-container" className="form-input-container">
                            <label>New folder name:</label>
                            <input type="text" disabled={newFolderInputDisabled} className="folder-name" onChange={(e) => {setNewFolderName(e.target.value)}}/>
                        </div>
                    </div>
                    <div className="form-input-container" style={{paddingLeft: "20px"}}>
                        <label>Tags (comma separated):</label>
                        <input type="text" className="link-tags" name="link-tags" placeholder="tag1,tag2,tag3" onChange={(e) => {setTags(e.target.value)}}/>
                    </div>
                    
                    <div className="submit-container">
                        <input type="button" className="submit-btn" disabled={submitDisabled} value={submitDisabled ? "Adding link..." : "Submit"} onClick={async (e) => {await handleSubmit(e);}}/>
                    </div>
                </div>
            </form>
        </div>
    );
}

function HeaderBar() {
    const userContext = useContext(UserContext);

    return (
        <>
            <div className="header-bar">
                <span className="title">LinkVault</span>
                <div className="sign-out-btn-container">
                    <p className="signed-in-user-label">Signed in as: </p>
                    <p className="signed-in-user">{userContext.user?.email}</p>
                    <SignOutButton/>
                </div>
            </div>
        </>
    );
}

function AddLinkButton() {
    const linkCreatorContext = useContext(LinkCreatorContext);

    function clickHandler() {
        linkCreatorContext.showLinkCreator ? linkCreatorContext.setShowLinkCreator(false) : linkCreatorContext.setShowLinkCreator(true);
    }

    return (
        <div className="add-link-btn-container">
        <button id="add-link-btn" className={linkCreatorContext.showLinkCreator ? "add-link-btn-open" : "add-link-btn-closed"} onClick={clickHandler} value="closed">
            {linkCreatorContext.showLinkCreator ? <div>cancel</div> : <div><span style={{fontSize: "20px", paddingRight: "5px"}}>+</span> Add Link</div>}
        </button>
        </div>
    );
}

function SignOutButton() {
    const userContext = useContext(UserContext);
    const [state, setState] = useState<"enabled" | "disabled">("enabled");
    const [label, setLabel] = useState<string>("Sign out");
    const buttonRef = useRef<HTMLButtonElement>(null);

    function clickHandler() {
        setState("disabled");
        setLabel("Signing out...");
        localStorage.removeItem("id");
        localStorage.removeItem("email");
        localStorage.removeItem("token");
        userContext.setUser(null);
        setLabel("Sign out");
        setState("enabled");
    }

    return (
        <button className="sign-out-btn" ref={buttonRef} disabled={state === "disabled"} onClick={clickHandler}>{label}</button>
    );
}