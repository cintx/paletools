let plugin;

// #if process.env.SBC_BUILDER_ENHACER
import styles from "./styles.css";
import UTLabelWithTextInputControl from "../../controls/UTLabelWithTextInputControl";
import localize from "../../localization";
import settings, { saveConfiguration } from "../../settings";
import { addLabelWithToggle } from "../../controls";
import { EVENTS, on } from "../../events";
import { hide, show } from "../../utils/visibility";
import { addStyle, removeStyle } from "../../utils/styles";
import storage from "../../services/storage";
import getCurrentController, { findControllerByType } from "../../utils/controller";


const cfg = settings.plugins.sbcBuilderEnhacer;

function addStyles() {
    addStyle('paletools-sbc-builder-enhacer', styles);
}

function removeStyles() {
    removeStyle('paletools-sbc-builder-enhacer');
}

function run() {

    const UTSquadBuilderView_generate = UTSquadBuilderView.prototype._generate;
    UTSquadBuilderView.prototype._generate = function _generate() {
        UTSquadBuilderView_generate.call(this);

        if (!cfg.enabled) return;

        if (!this._paletoolsGenerated) {
            this._ratingTitle = document.createElement("h4");
            this._ratingTitle.textContent = localize("plugins.sbcBuilderEnhacer.filter.ratings.title");
            this.__sortContainer.appendChild(this._ratingTitle);

            this._minRating = new UTLabelWithTextInputControl();
            this._minRating.init();
            this._minRating.setLabel(localize("plugins.sbcBuilderEnhacer.filter.ratings.min.label"));

            this._maxRating = new UTLabelWithTextInputControl();
            this._maxRating.init();
            this._maxRating.setLabel(localize("plugins.sbcBuilderEnhacer.filter.ratings.max.label"));



            const ratingContainer = document.createElement("div");
            ratingContainer.classList.add("sbc-ratings-container");
            ratingContainer.appendChild(this._minRating.getRootElement());
            ratingContainer.appendChild(this._maxRating.getRootElement());

            this.__sortContainer.appendChild(ratingContainer);


            this._settingsTitle = document.createElement("h4");
            this._settingsTitle.textContent = localize("plugins.sbcBuilderEnhacer.filter.settings.title");

            this._maxPlayers = new UTLabelWithTextInputControl();
            this._maxPlayers.init();
            this._maxPlayers.setLabel(localize("plugins.sbcBuilderEnhacer.filter.settings.maxPlayers.label"));

            this.__sortContainer.appendChild(this._settingsTitle);

            const searchOptions = document.createElement("div");
            searchOptions.classList.add("sbc-settings");
            searchOptions.appendChild(this._maxPlayers.getRootElement());


            this._searchToggles = new UTToggleControlGroupView();
            this._searchToggles.init();
            this._searchToggles.addToggleCell("ignore-positions", localize("plugins.sbcBuilderEnhacer.filter.search.ignorePlayersPos"));
            this._searchToggles.layoutSubviews();

            searchOptions.appendChild(this._searchToggles.getRootElement());

            this.__sortContainer.appendChild(searchOptions);

            on(EVENTS.APP_ENABLED, () => { addStyles(); show(ratingContainer); });
            on(EVENTS.APP_DISABLED, () => { removeStyles(); hide(ratingContainer); });

            addStyles();

            this._paletoolsGenerated = true;
        }
    }

    UTSquadBuilderView.prototype.onMinRatingChange = function (callback) {
        if (!this._minRating) return;
        if (!callback) return;
        this._minRating.onKeyDown(() => callback(this._minRating.value));
    }

    UTSquadBuilderView.prototype.onMaxRatingChange = function (callback) {
        if (!this._maxRating) return;
        if (!callback) return;
        this._maxRating.onKeyDown(() => callback(this._maxRating.value));
    }

    UTSquadBuilderView.prototype.onMaxPlayersChange = function (callback) {
        if (!this._maxPlayers) return;
        if (!callback) return;
        this._maxPlayers.onKeyDown(() => callback(this._maxPlayers.value));
    }

    UTSquadBuilderView.prototype.onMinRatingChange = function (callback) {
        if (!this._minRating) return;
        if (!callback) return;
        this._minRating.onKeyDown(() => callback(this._minRating.value));
    }

    UTSquadBuilderView.prototype.setMinRating = function (value) {
        if (!this._minRating) return;
        this._minRating.setInputValue(value);
    }

    UTSquadBuilderView.prototype.setMaxRating = function (value) {
        if (!this._maxRating) return;
        this._maxRating.setInputValue(value);
    }

    UTSquadBuilderView.prototype.setMaxPlayers = function (value) {
        if (!this._maxPlayers) return;
        this._maxPlayers.setInputValue(value);
    }

    UTSquadBuilderView.prototype.getMinRating = function () {
        if (!this._minRating) return;
        return parseInt(this._minRating.getInputValue()) || null;
    }

    UTSquadBuilderView.prototype.getMaxRating = function () {
        if (!this._maxRating) return;
        return parseInt(this._maxRating.getInputValue()) || null;
    }

    UTSquadBuilderView.prototype.getMaxPlayers = function () {
        if (!this._maxPlayers) return;
        return parseInt(this._maxPlayers.getInputValue()) || null;
    }

    UTSquadBuilderView.prototype.getSearchToggles = function () {
        return this._searchToggles;
    }

    const UTSquadBuilderView_destroyGeneratedElements = UTSquadBuilderView.prototype.destroyGeneratedElements;
    UTSquadBuilderView.prototype.destroyGeneratedElements = function destroyGeneratedElements() {
        UTSquadBuilderView_destroyGeneratedElements.call(this);

        if (!cfg.enabled) return;

        this._searchToggles.destroy();
    }

    const UTSquadBuilderViewController_init = UTSquadBuilderViewController.prototype.init;
    UTSquadBuilderViewController.prototype.init = function () {
        UTSquadBuilderViewController_init.call(this);

        if (!cfg.enabled) return;

        let storageKey;
        let searchSettings = {};
        if (this.challenge && this.challenge.id) {
            storageKey = `sbc:${this.challenge.id}:searchSettings`;
            searchSettings = storage.get(storageKey);
            if (searchSettings) {
                Object.assign(this.viewModel.searchCriteria, searchSettings.searchCriteria);

                this.getView().setMinRating(searchSettings.minRating || "");
                this.getView().setMaxRating(searchSettings.maxRating || "");
                this.getView().setMaxPlayers(searchSettings.maxPlayers || "");
                if (searchSettings.ignorePlayerPos) {
                    this.getView().getSearchToggles().toggleById('ignore-positions');
                }

                if (searchSettings.filterBy) {
                    if (searchSettings.filterBy[enums.UISortOptionType.CONCEPT]) {
                        this.getView().getSortOptions().toggleById(enums.UISortOptionType.CONCEPT);
                    }
                    if (searchSettings.filterBy[enums.UISortOptionType.UNTRADEABLE]) {
                        this.getView().getSortOptions().toggleById(enums.UISortOptionType.UNTRADEABLE);
                    }
                    if (searchSettings.filterBy[enums.UISortOptionType.EXCLUDE_SQUAD]) {
                        this.getView().getSortOptions().toggleById(enums.UISortOptionType.EXCLUDE_SQUAD);
                    }
                    if (searchSettings.filterBy[enums.UISortOptionType.REPLACE]) {
                        this.getView().getSortOptions().toggleById(enums.UISortOptionType.REPLACE);
                    }
                }

                if (searchSettings.sortBy) {
                    this.getView().getSortDropDown().setIndexById(searchSettings.sortBy);
                }
            }
            else {
                searchSettings = {};
            }
        }

        this.viewModel.searchSettings = searchSettings;

        const storeSettings = () => {
            if (storageKey) {
                storage.set(storageKey, searchSettings);
            }
            this.viewModel.searchSettings = searchSettings;
        }

        this.getView()._minRating.addTarget(this, () => {
            searchSettings.minRating = this.getView().getMinRating();
            storeSettings();
        }, EventType.CHANGE);

        this.getView()._maxRating.addTarget(this, () => {
            searchSettings.maxRating = this.getView().getMaxRating();
            storeSettings();
        }, EventType.CHANGE);

        this.getView()._maxPlayers.addTarget(this, () => {
            searchSettings.maxPlayers = this.getView().getMaxPlayers();
            storeSettings();
        }, EventType.CHANGE);

        this.getView()._searchToggles.addTarget(this, (_, __, opt) => {
            if (opt.id === "ignore-positions") {
                searchSettings.ignorePlayerPos = opt.checked;
            }
            storeSettings();
        }, EventType.CHANGE);

        this.getView().getSortOptions().addTarget(this, (_, __, opt) => {
            if (!searchSettings.filterBy) {
                searchSettings.filterBy = {};
            }

            searchSettings.filterBy[opt.id] = opt.checked;
            storeSettings();
        }, EventType.CHANGE);

        this.getView().getSortDropDown().addTarget(this, (t) => {
            searchSettings.sortBy = t.id;
            storeSettings();
        }, EventType.CHANGE);
    }

    const UTSquadBuilderViewController_onClubSearchComplete = UTSquadBuilderViewController.prototype.onClubSearchComplete;
    UTSquadBuilderViewController.prototype.onClubSearchComplete = function onClubSearchComplete(t, e) {

        if (cfg.enabled) {
            this.viewModel.searchSettings = this.viewModel.searchSettings || {};
            this.viewModel.searchSettings.minRating = this.getView().getMinRating();
            this.viewModel.searchSettings.maxRating = this.getView().getMaxRating();
            this.viewModel.searchSettings.maxPlayers = this.getView().getMaxPlayers();

            e.data.items = e.data.items.filter(x => {
                if (this.viewModel.searchSettings.minRating && x.rating < this.viewModel.searchSettings.minRating) {
                    return false;
                }

                if (this.viewModel.searchSettings.maxRating && x.rating > this.viewModel.searchSettings.maxRating) {
                    return false;
                }

                if (x.isLoaned()) {
                    return false;
                }

                if (UTItemEntity.isStoryMode(x.id)) {
                    return false;
                }

                return true;
            });

            if (this.viewModel.searchCriteria.sortBy === SearchSortType.RATING) {
                e.data.items.sort((a, b) => {
                    if (this.viewModel.searchCriteria.sort === "asc") {
                        return a.rating - b.rating;
                    } else {
                        return b.rating - a.rating;
                    }
                });
            }

            if (this.viewModel.searchSettings.maxPlayers && e.data.items.length > this.viewModel.searchSettings.maxPlayers) {
                e.data.items = e.data.items.slice(0, this.viewModel.searchSettings.maxPlayers);
            }

            if (this.challenge && this.challenge.id) {
                const storageKey = `sbc:${this.challenge.id}:searchSettings`;
                let searchSettings = storage.get(storageKey) || {};
                Object.assign(searchSettings, {
                    ...this.viewModel.searchSettings,
                    searchCriteria: this.viewModel.searchCriteria
                });
                storage.set(storageKey, searchSettings);
            }
        }

        UTSquadBuilderViewController_onClubSearchComplete.call(this, t, e);
    }

    const UTSquadBuilderViewModel_generatePlayerCollection = UTSquadBuilderViewModel.prototype.generatePlayerCollection;
    UTSquadBuilderViewModel.prototype.generatePlayerCollection = function (t, o, n) {
        if (!cfg.enabled) {
            return UTSquadBuilderViewModel_generatePlayerCollection.call(this, t, o, n);
        }

        const controller = findControllerByType(UTSquadBuilderViewController);
        const searchSettings = controller && controller.viewModel.searchSettings || {};
        if (!searchSettings.ignorePlayerPos) {
            return UTSquadBuilderViewModel_generatePlayerCollection.call(this, t, o, n);
        }

        let playerIndex = 0;
        return t.map(function (t, e) {
            var i = n ? n.getSlot(e) : null;
            return i && (i.isValid() || i.isBrick()) ? i.getItem() : o[playerIndex++];
        });
    }
}

function menu() {
    const container = document.createElement("div");
    addLabelWithToggle(container, "enabled", cfg.enabled, toggleState => {
        cfg.enabled = toggleState;
        saveConfiguration();
    });
    return container;
}

plugin = {
    run: run,
    order: 6,
    menu: menu,
    settings: {
        name: 'sbc-builder-enhacer',
        title: 'plugins.sbcBuilderEnhacer.settings.title',
        menu: menu
    }
}
// #endif

export default plugin;