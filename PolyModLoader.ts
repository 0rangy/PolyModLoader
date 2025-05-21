/**
 * Base class for all polytrack mods. Mods should export an instance of their mod class named `polyMod` in their main file.
 */
export class PolyMod {
    /**
     * The author of the mod.
     * 
     * @type {string}
     */
    get author() {
        return this.modAuthor;
    }
    modAuthor: string;
    /**
     * The mod ID.
     * 
     * @type {string}
     */
    get id() {
        return this.modID;
    }
    modID: string;
    /**
     * The mod name.
     * 
     * @type {string}
     */
    get name() {
        return this.modName;
    }
    modName: string;
    /**
     * The mod version.
     * 
     * @type {string}
     */
    get version() {
        return this.modVersion;
    }
    modVersion: string;
    /**
     * The the mod's icon file URL.
     * 
     * @type {string}
     */
    get iconSrc() {
        return this.IconSrc;
    }
    IconSrc: string;
    set iconSrc(src) {
        this.IconSrc = src;
    }
    loaded: boolean = false;
    set setLoaded(status) {
        this.loaded = status;
    }
    /**
     * The mod's loaded state.
     * 
     * @type {boolean}
     */
    get isLoaded() {
        return this.loaded;
    }
    /**
     * The mod's base URL.
     * 
     * @type {string}
     */
    get baseUrl() {
        return this.modBaseUrl;
    }
    modBaseUrl: string;
    set baseUrl(url) {
        this.modBaseUrl = url;
    }
    /**
     * Whether the mod has changed the game physics in some way.
     *  
     * @type {boolean}
     */
    get touchesPhysics() {
        return this.touchingPhysics;
    }
    touchingPhysics: boolean;
    /**
     * Other mods that this mod depends on.
     */
    get dependencies() {
        return this.modDependencies;
    }
    modDependencies: Array<{ version: string, id: string }>
    get descriptionUrl() {
        return this.modDescription;
    }
    modDescription: string;
    /**
     * Whether the mod is saved as to always fetch latest version (`true`)
     * or to fetch a specific version (`false`, with version defined by {@link PolyMod.version}).
     * 
     * @type {boolean}
     */
    get savedLatest() {
        return this.latestSaved;
    }
    latestSaved: boolean;
    set savedLatest(latest) {
        this.latestSaved = latest;
    }
    get initialized() {
        return this.modInitialized;
    }
    modInitialized: boolean;
    set initialized(initState) {
        this.modInitialized = initState;
    }
    polyVersion: Array<string>;
    assetFolder: string;
    applyManifest = (manifest: { polymod: { name: string, author: string, version: string, id: string, targets: Array<string> }, dependencies: Array<{ id: string, version: string }> }) => {
        const mod = manifest.polymod;
        /** @type {string} */
        this.modName = mod.name;
        /** @type {string} */
        this.modID = mod.id;
        /** @type {string} */
        this.modAuthor = mod.author;
        /** @type {string} */
        this.modVersion = mod.version;

        /** @type {string} */
        this.polyVersion = mod.targets;
        this.assetFolder = "assets";
        // no idea how to type annotate this
        // /** @type {{string: string}[]} */
        this.modDependencies = manifest.dependencies;
    }
    /**
     * Function to run during initialization of mods. Note that this is called *before* polytrack itself is loaded, 
     * but *after* everything has been declared.
     * 
     * @param {PolyModLoader} pmlInstance - The instance of {@link PolyModLoader}.
     */
    init = (pmlInstance: PolyModLoader) => { }
    /**
     * Function to run after all mods and polytrack have been initialized and loaded.
     */
    postInit = () => { }
    /**
     * Function to run before initialization of `simulation_worker.bundle.js`.
     */
    simInit = () => { }
}

/**
 * This class is used in {@link PolyModLoader}'s register mixin functions to set where functions should be injected into the target function.
 */
export enum MixinType {
    /**
     * Inject at the start of the target function.
     */
    HEAD = 0,
    /**
     * Inject at the end of the target function.
     */
    TAIL = 1,
    /**
     * Override the target function with the new function.
     */
    OVERRIDE = 2,
    /**
     * Insert code after a given token.
     */
    INSERT = 3,
    /**
     * Replace code between 2 given tokens. Inclusive.
     */
    REPLACEBETWEEN = 5,
    /**
     * Remove code between 2 given tokens. Inclusive.
     */
    REMOVEBETWEEN = 6,
    /**
     * Inserts code after a given token, but class wide.
     */
    CLASSINSERT = 8,
    /**
     * Replace code between 2 given tokens, but class wide. Inclusive.
     */
    CLASSREMOVE = 4,
    /**
     * Remove code between 2 given tokens, but class wide. Inclusive.
     */
    CLASSREPLACE = 7
}

export enum SettingType {
    BOOL = "boolean",
    SLIDER = "slider",
    CUSTOM = "custom"
}

export class SoundManager {
    #soundClass: any;
    constructor(soundClass: any) {
        this.#soundClass = soundClass;
    }
    registerSound(id: string, url: string) {
        this.#soundClass.load(id, url);
    }
    playSound(id: string, gain: number) {
        const e = this.#soundClass.getBuffer(id);
        if (null != e && null != this.#soundClass.context && null != this.#soundClass.destinationSfx) {
            const t = this.#soundClass.context.createBufferSource();
            t.buffer = e;
            const n = this.#soundClass.context.createGain();
            n.gain.value = gain,
            t.connect(n),
            n.connect(this.#soundClass.destinationSfx),
            t.start(0)
        }
    }
    playUIClick() {
        const e = this.#soundClass.getBuffer("click");
        if (null != e && null != this.#soundClass.context && null != this.#soundClass.destinationSfx) {
            const t = this.#soundClass.context.createBufferSource();
            t.buffer = e;
            const n = this.#soundClass.context.createGain();
            n.gain.value = .0075,
            t.connect(n),
            n.connect(this.#soundClass.destinationSfx),
            t.start(0)
        }
    }
}

export class PolyModLoader {
    #polyVersion: string;
    #allMods: Array<PolyMod>;
    #physicsTouched: boolean;
    #simWorkerClassMixins: Array<{
        scope: string,
        path: string,
        mixinType: MixinType,
        accessors: Array<string> | string,
        funcString: string,
        func2Sstring: string | null
    }>;
    #simWorkerFuncMixins: Array<{
        path: string,
        mixinType: MixinType,
        accessors: Array<string> | string,
        funcString: string,
        func2Sstring: string | null
    }>;

    #settings: Array<string>
    #settingConstructor: Array<string>
    #defaultSettings: Array<string>
    #latestSetting: number;

    #keybindings: Array<string>
    #defaultBinds: Array<string>
    #bindConstructor: Array<string>
    #latestBinding: number;

    constructor(polyVersion: string) {
        /** @type {string} */
        this.#polyVersion = polyVersion;
        /** @type {PolyMod[]} */
        this.#allMods = [];
        /** @type {boolean} */
        this.#physicsTouched = false;
        /** 
         * @type {{
         *      scope: string,
         *      path: string,
         *      mixinType: MixinType,
         *      accessors: string[],
         *      funcString: string,
         *  }}
         */
        this.#simWorkerClassMixins = [];
        /** 
         * @type {{
        *      path: string,
        *      mixinType: MixinType,
        *      accessors: string[],
        *      funcString: string,
        *  }}
        */
        this.#simWorkerFuncMixins = [];

        this.#settings = [];
        this.#settingConstructor = [];
        this.#defaultSettings = [];
        this.#latestSetting = 18;

        this.#keybindings = []
        this.#defaultBinds = []
        this.#bindConstructor = []
        this.#latestBinding = 31
    }
    localStorage: Storage
    #polyModUrls: Array<{ base: string, version: string, loaded: boolean }>
    initStorage(localStorage: Storage) {
        /** @type {Storage} */
        this.localStorage = localStorage;
        this.#polyModUrls = this.getPolyModsStorage();
    }
    async importMods() {
        for (let polyModObject of this.#polyModUrls) {
            let latest = false;
            if (polyModObject.version === "latest") {
                try {
                    const latestFile = await fetch(`${polyModObject.base}/latest.json`).then(r => r.json());
                    polyModObject.version = latestFile[this.#polyVersion];
                    latest = true;
                } catch (err) {
                    alert(`Couldn't find latest version for ${polyModObject.base}`);
                    console.error("Error in fetching latest version json:", err);
                }
            }
            const polyModUrl = `${polyModObject.base}/${polyModObject.version}`;
            try {
                const manifestFile = await fetch(`${polyModUrl}/manifest.json`).then(r => r.json());
                let mod = manifestFile.polymod;
                try {
                    const modImport = await import(`${polyModUrl}/${mod.main}`);

                    let newMod = modImport.polyMod;
                    mod.version = polyModObject.version;
                    if (this.getMod(mod.id)) alert(`Duplicate mod detected: ${mod.name}`);
                    newMod.applyManifest(manifestFile);
                    newMod.baseUrl = polyModObject.base;
                    newMod.applyManifest = (nothing) => { console.warn("Can't apply manifest after initialization!") }
                    newMod.savedLatest = latest;
                    newMod.iconSrc = `${polyModUrl}/icon.png`;
                    if (polyModObject.loaded) {
                        newMod.setLoaded = true;
                        if (newMod.touchesPhysics) {
                            this.#physicsTouched = true;
                            this.registerClassMixin("HB.prototype", "submitLeaderboard", MixinType.OVERRIDE, [], (e, t, n, i, r, a) => { })
                        }
                    }
                    this.#allMods.push(newMod);
                } catch (err) {
                    alert(`Mod ${mod.name} failed to load.`);
                    console.error("Error in loading mod:", err);
                }
            } catch (err) {
                alert(`Couldn't load mod with URL ${polyModUrl}.`);
                console.error("Error in loading mod URL:", err);
            }
        }
    }
    getPolyModsStorage() {
        const polyModsStorage = this.localStorage.getItem("polyMods");
        if (polyModsStorage) {
            this.#polyModUrls = JSON.parse(polyModsStorage);
        } else {
            this.#polyModUrls = [
                {
                    "base": "https://pml.orangy.cfd/PolyTrackMods/PolyModLoader/0.5.0/pmlcore",
                    "version": "latest",
                    "loaded": true
                }
            ];
            this.localStorage.setItem("polyMods", JSON.stringify(this.#polyModUrls));
        }
        return this.#polyModUrls;
    }
    serializeMod(mod: PolyMod) {
        return { "base": mod.baseUrl, "version": mod.savedLatest ? "latest" : mod.version, "loaded": mod.isLoaded || false };
    }
    saveModsToLocalStorage() {
        let savedMods: Array<{ base: string, version: string, loaded: boolean }> = [];
        for (let mod of this.#allMods) {
            const modSerialized = this.serializeMod(mod);
            savedMods.push(modSerialized);
        }
        this.#polyModUrls = savedMods;
        this.localStorage.setItem("polyMods", JSON.stringify(this.#polyModUrls));
    }
    /**
     * Reorder a mod in the internal list to change its priority in mod loading.
     * 
     * @param {PolyMod} mod  - The mod to reorder.
     * @param {number} delta - The amount to reorder it by. Positive numbers decrease priority, negative numbers increase priority.
     */
    reorderMod(mod: PolyMod, delta: number) {
        if (!mod) return;
        if (mod.id === "pmlcore") {
            return;
        }
        const currentIndex = this.#allMods.indexOf(mod);
        if ((currentIndex === 1) || delta > 0) return;
        if (currentIndex === null || currentIndex === undefined) {
            alert("This mod isn't loaded");
            return;
        }
        const temp = this.#allMods[currentIndex + delta];
        this.#allMods[currentIndex + delta] = this.#allMods[currentIndex];
        this.#allMods[currentIndex] = temp;
        this.saveModsToLocalStorage();
    }
    /**
     * Add a mod to the internal mod list. Added mod is given least priority.
     * 
     * @param {{base: string, version: string, loaded: bool}} polyModObject - The mod's JSON representation to add.
     */
    async addMod(polyModObject: { base: string, version: string, loaded: boolean }, autoUpdate: boolean) {
        let latest = false;
        if (polyModObject.version === "latest") {
            try {
                const latestFile = await fetch(`${polyModObject.base}/latest.json`).then(r => r.json());
                polyModObject.version = latestFile[this.#polyVersion];
                if (autoUpdate) {
                    latest = true;
                }
            } catch {
                alert(`Couldn't find latest version for ${polyModObject.base}`);
            }
        }
        const polyModUrl = `${polyModObject.base}/${polyModObject.version}`;
        try {
            const manifestFile = await fetch(`${polyModUrl}/manifest.json`).then(r => r.json());
            const mod = manifestFile.polymod;
            if (this.getMod(mod.id)) {
                alert("This mod is already present!");
                return;
            }
            if (mod.targets.indexOf(this.#polyVersion) === -1) {
                alert(
                    `Mod target version does not match polytrack version!
                    Note: ${mod.name} version ${polyModObject.version} targets polytrack versions ${mod.targets.join(', ')}, but current polytrack version is ${this.#polyVersion}.`
                );
                return;
            }
            try {
                const modImport = await import(`${polyModUrl}/${mod.main}`);
                let newMod = modImport.polyMod;
                newMod.iconSrc = `${polyModUrl}/icon.png`;
                mod.version = polyModObject.version;
                newMod.applyManifest(manifestFile);
                newMod.baseUrl = polyModObject.base;
                newMod.applyManifest = (nothing) => { console.warn("Can't apply manifest after initialization!") }
                newMod.savedLatest = latest;
                polyModObject.loaded = false;
                this.#allMods.push(newMod);
                this.saveModsToLocalStorage();
                return this.getMod(newMod.id);
            } catch (err) {
                alert("Something went wrong importing this mod!");
                console.error("Error in importing mod:", err);
                return;
            }
        } catch (err) {
            alert(`Couldn't find mod manifest for "${polyModObject.base}".`);
            console.error("Error in getting mod manifest:", err);
        }
    }
    registerSettingCategory(name: string) {
        this.#settings.push(`xI(this, eI, "m", gI).call(this, xI(this, nI, "f").get("${name}")),`);
    }
    registerBindCategory(name: string) {
        this.#keybindings.push(`,xI(this, eI, "m", vI).call(this, xI(this, nI, "f").get("${name}"))`);
    }
    registerSetting(name: string, id: string, type: SettingType, defaultOption: any, optionsOptional: any) {
        this.#latestSetting++
        this.#settingConstructor.push(`$o[$o.${id} = ${this.#latestSetting}] = "${id}";`);
        if (type === "boolean") {
            this.#defaultSettings.push(`, [$o.${id}, "${defaultOption ? "true" : "false"}"]`)
            this.#settings.push(`
                xI(this, eI, "m", wI).call(this, xI(this, nI, "f").get("${name}"), [{
                    title: xI(this, nI, "f").get("Off"),
                    value: "false"
                }, {
                    title: xI(this, nI, "f").get("On"),
                    value: "true"
                }], $o.${id}),
                `)
        } else if (type === "slider") {
            this.#defaultSettings.push(`, [$o.${id}, "${defaultOption}"]`)
            this.#settings.push(`
                 xI(this, eI, "m", yI).call(this, xI(this, nI, "f").get("${name}"), $o.${id}),`)
        } else if (type === "custom") {
            this.#defaultSettings.push(`, [$o.${id}, "${defaultOption}"]`)
            this.#settings.push(`
                xI(this, eI, "m", wI).call(this, xI(this, nI, "f").get("${name}"), ${JSON.stringify(optionsOptional)}, $o.${id}),
                `)
        }
    }
    settingClass: any;
    soundManager: SoundManager;
    registerKeybind(name: string, id: string, event: string, defaultBind: string, secondBindOptional: string | null, callback: Function) {
        this.#keybindings.push(`,xI(this, eI, "m", AI).call(this, xI(this, nI, "f").get("${name}"), Ix.${id})`);
        this.#bindConstructor.push(`Ix[Ix.${id} = ${this.#latestBinding}] = "${id}";`);
        this.#defaultBinds.push(`, [Ix.${id}, ["${defaultBind}", ${secondBindOptional ? `"${secondBindOptional}"` : "null"}]]`);
        this.#latestBinding++;
        window.addEventListener(event, (e) => {
            if (this.settingClass.checkKeyBinding(e, this.getFromPolyTrack(`Ix.${id}`))) {
                callback(e)
            }
        });
    }
    #applySettings() {
        this.registerClassMixin("ul.prototype", "load", MixinType.INSERT, `dl(this, tl, "f").addResource(),`, `ActivePolyModLoader.soundManager = new SoundManager(this);`)
        this.registerClassMixin("ZB.prototype", "defaultSettings", MixinType.INSERT, `defaultSettings() {`, `ActivePolyModLoader.settingClass = this;${this.#settingConstructor.join("")}`)
        this.registerClassMixin("ZB.prototype", "defaultSettings", MixinType.INSERT, `[$o.CheckpointVolume, "1"]`, this.#defaultSettings.join(""))
        this.registerFuncMixin("mI", MixinType.INSERT, "), $o.CheckpointVolume),", this.#settings.join(""))
    }

    #applyKeybinds() {
        this.registerClassMixin("ZB.prototype", "defaultKeyBindings", MixinType.INSERT, `defaultKeyBindings() {`, `${this.#bindConstructor.join("")};`)
        this.registerClassMixin("ZB.prototype", "defaultKeyBindings", MixinType.INSERT, `[Ix.SpectatorSpeedModifier, ["ShiftLeft", "ShiftRight"]]`, this.#defaultBinds.join(""))
        this.registerFuncMixin("mI", MixinType.INSERT, "), Ix.ToggleSpectatorCamera)", this.#keybindings.join(""))
    }
    getSetting(id: string) {
        return this.getFromPolyTrack(`ActivePolyModLoader.settingClass.getSetting($o.${id})`);
    }
    registerSoundOverride(id: string, url: string) {
        this.registerClassMixin("ul.prototype", "load", MixinType.INSERT, `dl(this, tl, "f").addResource(),`, `
            null;
            if(e === "${id}") {
                t = ["${url}"];
            }`)
    }
    /**
     * Remove a mod from the internal list.
     * 
     * @param {PolyMod} mod - The mod to remove.
     */
    removeMod(mod) {
        if (!mod) return;
        if (mod.id === "pmlcore") {
            return;
        }
        const index = this.#allMods.indexOf(mod);
        if (index > -1) {
            this.#allMods.splice(index, 1);
        }
        this.saveModsToLocalStorage();
    }
    /**
     * Set the loaded state of a mod.
     * 
     * @param {PolyMod} mod   - The mod to set the state of.
     * @param {boolean} state - The state to set. `true` is loaded, `false` is unloaded.
     */
    setModLoaded(mod, state) {
        if (!mod) return;
        if (mod.id === "pmlcore") {
            return;
        }
        mod.loaded = state;
        this.saveModsToLocalStorage();
    }
    popUpClass: any;
    #preInitPML() {
        this.registerFuncMixin("polyInitFunction", MixinType.INSERT, `let L = new BD(h,x,b,A,k,f,S,m,v,y,a,c,p,g,e,!1,_,C,P,I,R)
            , D = 0;`, `ActivePolyModLoader.popUpClass = S;`)
    }
    initMods() {
        this.#preInitPML();
        let initList: Array<string> = []
        for (let polyMod of this.#allMods) {
            if (polyMod.isLoaded)
                initList.push(polyMod.id);
        }
        if (initList.length === 0) return; // no mods to initialize lol
        let allModsInit = false;
        while (!allModsInit) {
            let currentMod: PolyMod | undefined = this.getMod(initList[0]);
            if (!currentMod)
                continue;
            console.log(initList[0]);
            let initCheck = true;
            for (let dependency of currentMod.dependencies) {
                let curDependency = this.getMod(dependency.id)
                if (!curDependency) {
                    initCheck = false;
                    initList.splice(0, 1);
                    alert(`Mod ${currentMod.name} is missing mod ${dependency.id} ${dependency.version} and will not be initialized.`);
                    console.warn(`Mod ${currentMod.name} is missing mod ${dependency.id} ${dependency.version} and will not be initialized.`);
                    break;
                }
                if(!curDependency.isLoaded) {
                    initCheck = false;
                    initList.splice(0, 1);
                    alert(`Mod ${currentMod.name} depends on mod ${dependency.id} ${dependency.version} but the dependency isn't loaded. Mod will not be initialized.`);
                    console.warn(`Mod ${currentMod.name} depends on mod ${dependency.id} ${dependency.version} but the dependency isn't loaded. Mod will not be initialized.`);
                    break;
                }
                if (curDependency.version !== dependency.version) {
                    initCheck = false;
                    initList.splice(0, 1);
                    alert(`Mod ${currentMod.name} needs version ${dependency.version} of ${curDependency.name} but ${curDependency.version} is present.`);
                    console.warn(`Mod ${currentMod.name} needs version ${dependency.version} of ${curDependency.name} but ${curDependency.version} is present.`);
                    break;
                }
                if (!curDependency.initialized) {
                    initCheck = false;
                    initList.splice(0, 1);
                    initList.push(currentMod.id);
                    break;
                }
            }
            if (initCheck) {
                try {
                    currentMod.init(this);
                    currentMod.initialized = true;
                    initList.splice(0, 1);
                } catch(err) {
                    alert(`Mod ${currentMod.name} failed to initialize and will be unloaded.`);
                    console.error("Error in initializing mod:", err);
                    this.setModLoaded(currentMod, false);
                    initList.splice(0, 1);
                }
            }
            if (initList.length === 0)
                allModsInit = true;
        }
        this.#applySettings();
        this.#applyKeybinds();
    }
    postInitMods() {
        for (let polyMod of this.#allMods) {
            if (polyMod.isLoaded) {
                try {
                    polyMod.postInit();
                } catch(err) {
                    alert(`Mod ${polyMod.name} failed to post initialize and will be unloaded.`);
                    console.error("Error in post initializing mod:", err);
                    this.setModLoaded(polyMod, false);
                }
            }
        }
    }
    simInitMods() {
        for (let polyMod of this.#allMods) {
            if (polyMod.isLoaded) polyMod.simInit();
        }
    }
    /**
     * Access a mod by its mod ID.
     * 
     * @param   {string} id - The ID of the mod to get
     * @returns {PolyMod}   - The requested mod's object.
     */
    getMod(id) {
        for (let polyMod of this.#allMods) {
            if (polyMod.id == id) return polyMod;
        }
    }
    /**
     * Get the list of all mods.
     * 
     * @type {PolyMod[]}
     */
    getAllMods() {
        return this.#allMods;
    }
    /**
     * Whether uploading runs to leaderboard is invalid or not.
     */
    get lbInvalid() {
        return this.#physicsTouched;
    }
    getFromPolyTrack = (path: string) => { }
    /**
     * Inject mixin under scope {@link scope} with target function name defined by {@link path}.
     * This only injects functions in `main.bundle.js`.
     * 
     * @param {string} scope        - The scope under which mixin is injected.
     * @param {string} path         - The path under the {@link scope} which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerClassMixin = (scope: string, path: string, mixinType: MixinType, accessors: string | Array<string>, func: Function | string, extraOptinonal?: Function | string) => { }
    /**
     * Inject mixin with target function name defined by {@link path}.
     * This only injects functions in `main.bundle.js`.
     * 
     * @param {string} path         - The path of the function which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerFuncMixin = (path: string, mixinType: MixinType, accessors: string | Array<string>, func: Function | string, extraOptinonal?: Function | string) => { }
    registerClassWideMixin = (path: string, mixinType: MixinType, firstToken: string, funcOrSecondToken: string | Function, funcOptional?: Function | string) => { }
    /**
     * Inject mixin under scope {@link scope} with target function name defined by {@link path}.
     * This only injects functions in `simulation_worker.bundle.js`.
     * 
     * @param {string} scope        - The scope under which mixin is injected.
     * @param {string} path         - The path under the {@link scope} which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerSimWorkerClassMixin(scope: string, path: string, mixinType: MixinType, accessors: string | Array<string>, func: Function | string, extraOptinonal?: Function | string) {
        this.registerClassMixin("HB.prototype", "submitLeaderboard", MixinType.OVERRIDE, [], (e, t, n, i, r, a) => { })
        this.#simWorkerClassMixins.push({
            scope: scope,
            path: path,
            mixinType: mixinType,
            accessors: accessors,
            funcString: typeof func === "function" ? func.toString() : func,
            func2Sstring: extraOptinonal ? extraOptinonal.toString() : null
        })
    }
    /**
     * Inject mixin with target function name defined by {@link path}.
     * This only injects functions in `simulation_worker.bundle.js`.
     * 
     * @param {string} path         - The path of the function which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerSimWorkerFuncMixin(path: string, mixinType: MixinType, accessors: string | Array<string>, func: Function | string, extraOptinonal?: Function | string) {
        this.registerClassMixin("HB.prototype", "submitLeaderboard", MixinType.OVERRIDE, [], (e, t, n, i, r, a) => { })
        this.#simWorkerFuncMixins.push({
            path: path,
            mixinType: mixinType,
            accessors: accessors,
            funcString: typeof func === "function" ? func.toString() : func,
            func2Sstring: extraOptinonal ? extraOptinonal.toString() : null
        })
    }
}

const ActivePolyModLoader = new PolyModLoader("0.5.0");

export { ActivePolyModLoader }
