
let plugin;

/// #if process.env.UNASSIGNED_DUPLICATES
import { addLabelWithToggle } from "../../controls";
import localize from "../../localization";
import settings, { saveConfiguration } from "../../settings";
import { addClass, append } from "../../utils/dom";
const cfg = settings.plugins.unassignedDuplicates;

function run() {
    const UTUnassignedItemsViewController_updateDuplicateSectionOptions = UTUnassignedItemsViewController.prototype._updateDuplicateSectionOptions;
    UTUnassignedItemsViewController.prototype._updateDuplicateSectionOptions = function _updateDuplicateSectionOptions(...args) {
        UTUnassignedItemsViewController_updateDuplicateSectionOptions.call(this, ...args);

        if(!cfg.enabled || !settings.enabled) return;

        const duplicateSection = this._viewmodel.getDuplicateSection();

        if(!duplicateSection) return;

        const untradeableDuplicates = duplicateSection.filter(x => x.untradeable);

        if(!untradeableDuplicates || untradeableDuplicates.length === 0) return;

        const header = this.getView().getSection(UTUnassignedItemsViewModel.SECTION.DUPLICATES)._header;
        
        const switchButton = new UTStandardButtonControl();
        switchButton.init();
        switchButton.setText(localize("plugins.unassignedDuplicates.buttons.switchUntradeables"));
        addClass(switchButton, "section-header-btn", "mini", "call-to-action");
        switchButton.addTarget(this, () => {
            services.Item.move(untradeableDuplicates, ItemPile.CLUB).observe(this, this._onMoveToClubComplete);
        }, EventType.TAP);
        append(header, switchButton);
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
    order: 10,
    settings: {
        name: 'unassigned-duplicates',
        title: 'plugins.unassignedDuplicates.settings.title',
        menu: menu
    }
};
/// #endif

export default plugin;