/*!
This plugin is a copy of https://github.com/ckalgos/fut-trade-enhancer/blob/main/app/function-overrides/store-override.js
with some minor modification to be adapted to Paletools coding style
*/

let plugin;
/// #if process.env.PACKS_OPENER
import styles from "./styles.css";
import { addLabelWithToggle } from "../../controls";
import localize from "../../localization";
import { getUserCredits } from "../../services/credits";
import { openDialog } from "../../services/dialog";
import { getUnassignedItems, discardItems, moveItemsToClub, moveItemsToTransferList } from "../../services/item";
import settings, { saveConfiguration } from "../../settings";
import delay from "../../utils/delay";
import { select, selectAll } from "../../utils/dom";
import { show, hide } from "../../utils/visibility";
import { addStyle, removeStyle } from "../../utils/styles";
import { displayLoader, hideLoader } from "../../utils/loader";
import { notifyFailure, notifyNeutral } from "../../utils/notifications";
import { toPromise } from "../../utils/observable";
import { EVENTS, on } from "../../events";

const cfg = settings.plugins.packsOpener;

function addStyles() {
    addStyle('paletools-packs-opener', styles);
}

function removeStyles() {
    removeStyle('paletools-packs-opener');
}

const PURCHASE_ACTION = {
    MOVE_TO_CLUB: 'club',
    MOVE_TO_TRANSFER_LIST: 'transferList',
    QUICK_SELL: 'quickSell',
    STOP_PROCESS: 'stopProcess'
};

const BuyPackResult = {
    SUCCESS: 'success',
    UNASSIGNED_ITEMS: 'unassignedItems',
    NOT_ENOUGH_CREDITS: 'notEnoughCredits',
    TRANSFER_LIST_FULL: 'transferListFull',
    ERROR: 'error'
};

const HandleItemResult = {
    SUCCESS: 'success',
    TRANSFER_LIST_FULL: 'transferListFull',
    ERROR: 'error'
};

function run() {
    addStyles();

    on(EVENTS.APP_ENABLED, () => addStyles());
    on(EVENTS.APP_DISABLED, () => removeStyles());

    async function autoOpenPacks(packCoinsValue) {
        const response = await toPromise(services.Store.getPacks());
        const pack = response.response.packs.find(x => x.id === this.articleId);

        if (!pack) {
            notifyFailure(localize("plugins.packsOpener.errors.missingPack"));
            return;
        }

        openDialog(
            [
                { labelEnum: enums.UIDialogOptions.OK },
                { labelEnum: enums.UIDialogOptions.CANCEL },
            ],
            localize("plugins.packsOpener.settings.title"),
            `<div class="pack-opener-dialog">
                <label for="pack-opener-speed">${localize("plugins.packsOpener.labels.speed")}</label>
                <select id="pack-opener-speed">
                    <option value="3">${localize("plugins.packsOpener.speed.slow")}</option>
                    <option value="1">${localize("plugins.packsOpener.speed.fast")}</option>
                </select> 

                <label for="pack-opener-purchase-count">${localize("plugins.packsOpener.labels.packsCount")}</label>
                <input id="pack-opener-purchase-count" type="number" min="0" class="ut-text-input-control fut-bin-buy" />
                <label id="coins-to-spend"></label>

                <label for="pack-opener-currency">${localize("plugins.packsOpener.labels.currency")}</label>
                <select id="pack-opener-currency">
                    <option value="${GameCurrency.COINS}">${localize("currency.coins")}</option>
                    <option value="${GameCurrency.POINTS}">${localize("currency.points")}</option>
                </select>

                <label for="pack-opener-players-purchase-action">${localize("plugins.packsOpener.labels.purchaseAction.players")}</label>
                <select id="pack-opener-players-purchase-action" data-purchase-action="players">
                    <option value="${PURCHASE_ACTION.MOVE_TO_CLUB}">${localize("plugins.packsOpener.purchaseAction.moveToClub")}</option>
                    <option value="${PURCHASE_ACTION.MOVE_TO_TRANSFER_LIST}">${localize("plugins.packsOpener.purchaseAction.moveToTransferList")}</option>
                    <option value="${PURCHASE_ACTION.QUICK_SELL}">${localize("plugins.packsOpener.purchaseAction.quickSell")}</option>
                </select> 

                <label for="pack-opener-duplicated-players-purchase-action">${localize("plugins.packsOpener.labels.purchaseAction.duplicatePlayers")}</label>
                <select id="pack-opener-duplicated-players-purchase-action" data-purchase-action="duplicatedPlayers">
                    <option value="${PURCHASE_ACTION.MOVE_TO_TRANSFER_LIST}">${localize("plugins.packsOpener.purchaseAction.moveToTransferList")}</option>
                    <option value="${PURCHASE_ACTION.QUICK_SELL}">${localize("plugins.packsOpener.purchaseAction.quickSell")}</option>
                </select> 

                <label for="pack-opener-managers-purchase-action">${localize("plugins.packsOpener.labels.purchaseAction.managers")}</label>
                <select id="pack-opener-managers-purchase-action" data-purchase-action="managers">
                    <option value="${PURCHASE_ACTION.MOVE_TO_CLUB}">${localize("plugins.packsOpener.purchaseAction.moveToClub")}</option>
                    <option value="${PURCHASE_ACTION.MOVE_TO_TRANSFER_LIST}">${localize("plugins.packsOpener.purchaseAction.moveToTransferList")}</option>
                    <option value="${PURCHASE_ACTION.QUICK_SELL}">${localize("plugins.packsOpener.purchaseAction.quickSell")}</option>
                </select> 

                <label for="pack-opener-duplicated-managers-purchase-action">${localize("plugins.packsOpener.labels.purchaseAction.duplicateManagers")}</label>
                <select id="pack-opener-duplicated-managers-purchase-action" data-purchase-action="duplicatedManagers">
                    <option value="${PURCHASE_ACTION.MOVE_TO_TRANSFER_LIST}">${localize("plugins.packsOpener.purchaseAction.moveToTransferList")}</option>
                    <option value="${PURCHASE_ACTION.QUICK_SELL}">${localize("plugins.packsOpener.purchaseAction.quickSell")}</option>
                </select> 

                <label for="pack-opener-items-purchase-action">${localize("plugins.packsOpener.labels.purchaseAction.items")}</label>
                <select id="pack-opener-items-purchase-action" data-purchase-action="items">
                    <option value="${PURCHASE_ACTION.MOVE_TO_CLUB}">${localize("plugins.packsOpener.purchaseAction.moveToClub")}</option>
                    <option value="${PURCHASE_ACTION.MOVE_TO_TRANSFER_LIST}">${localize("plugins.packsOpener.purchaseAction.moveToTransferList")}</option>
                    <option value="${PURCHASE_ACTION.QUICK_SELL}">${localize("plugins.packsOpener.purchaseAction.quickSell")}</option>
                </select> 

                <label for="pack-opener-duplicated-items-purchase-action">${localize("plugins.packsOpener.labels.purchaseAction.duplicateItems")}</label>
                <select id="pack-opener-duplicated-items-purchase-action" data-purchase-action="duplicatedItems">
                    <option value="${PURCHASE_ACTION.MOVE_TO_TRANSFER_LIST}">${localize("plugins.packsOpener.purchaseAction.moveToTransferList")}</option>
                    <option value="${PURCHASE_ACTION.QUICK_SELL}">${localize("plugins.packsOpener.purchaseAction.quickSell")}</option>
                </select> 

                <label for="pack-opener-transfer-list-full-purchase-action">${localize("plugins.packsOpener.labels.purchaseAction.transferListFull")}</label>
                <select id="pack-opener-transfer-list-full-purchase-action" data-purchase-action="transferListFull">
                    <option value="${PURCHASE_ACTION.QUICK_SELL}">${localize("plugins.packsOpener.purchaseAction.quickSell")}</option>
                    <option value="${PURCHASE_ACTION.STOP_PROCESS}">${localize("plugins.packsOpener.purchaseAction.stopProcess")}</option>
                </select> 
             </div>
             `,
            (text) => {
                if (text == enums.UIDialogOptions.OK) {
                    openPack(pack,
                        select("#pack-opener-speed").value,
                        select("#pack-opener-players-purchase-action").value,
                        select("#pack-opener-duplicated-players-purchase-action").value,
                        select("#pack-opener-managers-purchase-action").value,
                        select("#pack-opener-duplicated-managers-purchase-action").value,
                        select("#pack-opener-items-purchase-action").value,
                        select("#pack-opener-duplicated-items-purchase-action").value,
                        select("#pack-opener-transfer-list-full-purchase-action").value,
                        parseInt(select("#pack-opener-purchase-count").value),
                        select("#pack-opener-currency").value);
                }
            }
        );

        const currencySelect = select("#pack-opener-currency");
        const coinsToSpendLabel = select("#coins-to-spend");
        hide(coinsToSpendLabel);
        on(select("#pack-opener-purchase-count"), "change", ev => {
            if (currencySelect.value != GameCurrency.COINS) return;

            const value = parseInt(ev.target.value);
            if (value > 0) {
                show(coinsToSpendLabel);
                coinsToSpendLabel.textContent = `${localize("currency.coins")}: ${packCoinsValue * value}`;
            }
            else {
                hide(coinsToSpendLabel);
            }


        });

        for (let purchaseActionSelect of selectAll("[data-purchase-action]")) {
            const cfgValue = cfg.purchaseActions[purchaseActionSelect.dataset.purchaseAction];

            if (cfgValue) {
                purchaseActionSelect.value = cfgValue;
            }
        }
    }

    const UTStorePackDetailsView_setupBuyCoinsButton = UTStorePackDetailsView.prototype.setupBuyCoinsButton;
    UTStorePackDetailsView.prototype.setupBuyCoinsButton = function (...params) {
        UTStorePackDetailsView_setupBuyCoinsButton.call(this, ...params);

        if (!settings.enabled || !cfg.enabled) return;

        this._btnOpenPacks && this.removeActionButton(this._btnOpenPacks);
        this._btnOpenPacks = new UTCurrencyButtonControl();
        this._btnOpenPacks.init();
        this._btnOpenPacks.setText(localize("plugins.packsOpener.button.text"));
        this._btnOpenPacks.setSubText(localize("plugins.packsOpener.button.subtext"));
        this._btnOpenPacks.addClass("call-to-action pack-opener");
        this._btnOpenPacks.addTarget(this, function () {
            autoOpenPacks.call(this, params[0]);
        }, EventType.TAP);
        this.appendActionButton(this._btnOpenPacks);
    }

    async function openPack(pack,
        speedMultiplier,
        playersPurchaseAction,
        duplicatedPlayersPurchaseAction,
        managersPurchaseAction,
        duplicatedManagersPurchaseAction,
        itemsPurchaseAction,
        duplicatedItemsPurchaseAction,
        transferListFullPurchaseAction,
        purchaseCount,
        currency) {

        const state = {
            coinsSpent: 0,
            coinsEarned: 0,
            pointsSpent: 0,
            packsOpened: 0,
            players: 0,
            playersToClub: 0,
            playersToTransferList: 0,
            playersDiscarded: 0,
            duplicatedPlayers: 0,
            managers: 0,
            duplicatedManagers: 0,
            managersToClub: 0,
            managersToTransferList: 0,
            managersDiscarded: 0,
            items: 0,
            duplicatedItems: 0,
            itemsToClub: 0,
            itemsToTransferList: 0,
            itemsDiscarded: 0
        };

        cfg.purchaseActions = cfg.purchaseActions || {};
        cfg.speedMultiplier = speedMultiplier;
        cfg.purchaseActions.players = playersPurchaseAction;
        cfg.purchaseActions.duplicatedPlayers = duplicatedPlayersPurchaseAction;
        cfg.purchaseActions.managers = managersPurchaseAction;
        cfg.purchaseActions.duplicatedManagers = duplicatedManagersPurchaseAction;
        cfg.purchaseActions.items = itemsPurchaseAction;
        cfg.purchaseActions.duplicatedItems = duplicatedItemsPurchaseAction;
        cfg.purchaseActions.transferListFull = transferListFullPurchaseAction;
        saveConfiguration();

        displayLoader();
        while (purchaseCount > 0) {
            const buyPackResult = await buyPack(
                pack,
                speedMultiplier,
                playersPurchaseAction,
                duplicatedPlayersPurchaseAction,
                managersPurchaseAction,
                duplicatedManagersPurchaseAction,
                itemsPurchaseAction,
                duplicatedItemsPurchaseAction,
                transferListFullPurchaseAction,
                currency,
                state);
            if (buyPackResult !== BuyPackResult.SUCCESS) {
                hideLoader();

                let failureMessage;
                switch (buyPackResult) {
                    case BuyPackResult.ERROR:
                        failureMessage = localize("plugins.packsOpener.errors.generic");
                        break;
                    case BuyPackResult.UNASSIGNED_ITEMS:
                        failureMessage = localize("popup.error.unassignedItemsEntitlementTitle");
                        break;
                    case BuyPackResult.NOT_ENOUGH_CREDITS:
                        failureMessage = localize("popup.error.tradetoken.NotEnoughCredits");
                        break;
                    case BuyPackResult.TRANSFER_LIST_FULL:
                        failureMessage = localize("plugins.packsOpener.errors.transferListFull");
                        break;
                }
                notifyFailure(failureMessage);
                break;
            }
            else {
                await delay(527 * speedMultiplier, 1378 * speedMultiplier);
                purchaseCount--;
                notifyNeutral(localize("plugins.packsOpener.packsRemaining").replace('#', purchaseCount));
            }
        }
        hideLoader();
        showOpenPackResult(state);
    };

    function showOpenPackResult(state) {
        openDialog(
            [
                { labelEnum: enums.UIDialogOptions.OK }, ,
            ],
            localize("plugins.packsOpener.packResult.title"),
            `<div class="pack-opener-result">${localize("plugins.packsOpener.packResult.html")
                .replace("{packs}", state.packsOpened)
                .replace("{players}", state.players)
                .replace("{playersToClub}", state.playersToClub)
                .replace("{playersToTransfer}", state.playersToTransferList)
                .replace("{playersDiscarded}", state.playersDiscarded)
                .replace("{duplicatedPlayers}", state.duplicatedPlayers)
                .replace("{managers}", state.managers)
                .replace("{managersToClub}", state.managersToClub)
                .replace("{managersToTransfer}", state.managersToTransferList)
                .replace("{managersDiscarded}", state.managersDiscarded)
                .replace("{duplicatedManagers}", state.duplicatedManagers)
                .replace("{items}", state.items)
                .replace("{itemsToClub}", state.itemsToClub)
                .replace("{itemsToTransfer}", state.itemsToTransferList)
                .replace("{itemsDiscarded}", state.itemsDiscarded)
                .replace("{duplicatedItems}", state.duplicatedItems)
                .replace("{coinsSpent}", state.coinsSpent)
                .replace("{coinsEarned}", state.coinsEarned)}
                </div>`
        );
    }

    function handleNonDuplicatePlayers(items, action, transferListFullPurchaseAction, state) {
        const nonDuplicatePlayers = items.filter(item => !item.isDuplicate() && item.isPlayer());
        //notifyNeutral(localize("plugins.packsOpener.handlingNonDuplicatePlayers"));

        state.players += nonDuplicatePlayers.length;

        return handleItems(nonDuplicatePlayers, action, transferListFullPurchaseAction,
            {
                discard: (count, value) => { state.playersDiscarded += count; state.coinsEarned += value; },
                moveToTransferList: count => state.playersToTransferList += count,
                moveToClub: count => state.playersToClub += count
            });
    };

    function handleNonDuplicateManagers(items, action, transferListFullPurchaseAction, state) {
        const nonDuplicateManagers = items.filter(item => !item.isDuplicate() && item.isManager());

        state.managers += nonDuplicateManagers.length;

        return handleItems(nonDuplicateManagers, action, transferListFullPurchaseAction,
            {
                discard: (count, value) => { state.managersDiscarded += count; state.coinsEarned += value; },
                moveToTransferList: count => state.managersToTransferList += count,
                moveToClub: count => state.managersToClub += count
            });
    };

    function handleNonDuplicateItems(items, action, transferListFullPurchaseAction, state) {
        const nonDuplicateItems = items.filter(item => !item.isDuplicate() && !item.isPlayer() && !item.isManager() && !item.isMiscItem());

        state.items += nonDuplicateItems.length;

        return handleItems(nonDuplicateItems, action, transferListFullPurchaseAction,
            {
                discard: (count, value) => { state.itemsDiscarded += count; state.coinsEarned += value; },
                moveToTransferList: count => state.itemsToTransferList += count,
                moveToClub: count => state.itemsToClub += count
            });
    };

    function handleDuplicatedPlayers(items, action, transferListFullPurchaseAction, state) {
        const duplicatePlayers = items.filter((item) => item.isDuplicate() && item.isPlayer());

        state.players += duplicatePlayers.length;
        state.duplicatedPlayers += duplicatePlayers.length;

        return handleItems(duplicatePlayers, action, transferListFullPurchaseAction,
            {
                discard: (count, value) => { state.playersDiscarded += count; state.coinsEarned += value; },
                moveToTransferList: count => state.playersToTransferList += count,
                moveToClub: count => state.playersToClub += count
            });
    };

    function handleDuplicatedManagers(items, action, transferListFullPurchaseAction, state) {
        const duplicateManagers = items.filter((item) => item.isDuplicate() && item.isManager());

        state.managers += duplicateManagers.length;
        state.duplicatedManagers += duplicateManagers.length;

        return handleItems(duplicateManagers, action, transferListFullPurchaseAction,
            {
                discard: (count, value) => { state.managersDiscarded += count; state.coinsEarned += value; },
                moveToTransferList: count => state.managersToTransferList += count,
                moveToClub: count => state.managersToClub += count
            });
    };

    function handleDuplicatedItems(items, action, transferListFullPurchaseAction, state) {
        const duplicateItems = items.filter((item) => item.isDuplicate() && !item.isPlayer() && !item.isManager() && !item.isMiscItem());

        state.items += duplicateItems.length;
        state.duplicatedItems += duplicateItems.length;

        return handleItems(duplicateItems, action, transferListFullPurchaseAction,
            {
                discard: (count, value) => { state.itemsDiscarded += count; state.coinsEarned += value; },
                moveToTransferList: count => state.itemsToTransferList += count,
                moveToClub: count => state.itemsToClub += count
            });
    };

    async function handleMiscItems(items, action1, action2, state) {
        const miscItems = items.filter((item) => item.isMiscItem());
        if (miscItems.length === 0) return HandleItemResult.SUCCESS;
        //notifyNeutral(localize("plugins.packsOpener.handlingCredits"));
        try {
            await Promise.all(
                miscItems.map(async (credit) => {
                    try {
                        if(credit.amount){
                            state.coinsEarned += credit.amount;
                        }
                    }
                    catch(ex){
                        console.log(ex);
                    }
                    services.Item.redeem(credit);
                    await delay(389, 675);
                })
            );
        }
        catch (ex) {
            HandleItemResult.ERROR
        }

        return HandleItemResult.SUCCESS;
    };


    async function handleItems(items, action, transferListFullPurchaseAction, stateActions) {
        if (items.length === 0) return HandleItemResult.SUCCESS;

        function getDiscardValue(items) {
            const discardValue = items.reduce((accumulator, currentItem) => {
                return accumulator + currentItem.discardValue;
            }, 0);

            return discardValue;
        }

        let result;
        switch (action) {
            case PURCHASE_ACTION.MOVE_TO_TRANSFER_LIST:
                if (repositories.Item.isPileFull(ItemPile.TRANSFER)) {
                    if (transferListFullPurchaseAction === PURCHASE_ACTION.STOP_PROCESS) {
                        return HandleItemResult.TRANSFER_LIST_FULL;
                    }
                    else {
                        result = await discardItems(items);
                        if (result.success) {
                            stateActions.discard(items.length, getDiscardValue(items));
                        }
                    }
                }
                result = await moveItemsToTransferList(items);
                if (result.success) stateActions.moveToTransferList(items.length);
                break;
            case PURCHASE_ACTION.MOVE_TO_CLUB:
                result = await moveItemsToClub(items);
                if (result.success) stateActions.moveToClub(items.length);
                break;
            case PURCHASE_ACTION.QUICK_SELL:
                result = await discardItems(items);
                if (result.success) stateActions.discard(items.length, getDiscardValue(items));
                break;
        }

        if (!result.success) {
            return HandleItemResult.ERROR;
        }

        return HandleItemResult.SUCCESS;
    };

    async function buyPack(pack,
        speedMultiplier,
        playersPurchaseAction,
        duplicatedPlayersPurchaseAction,
        managersPurchaseAction,
        duplicatedManagersPurchaseAction,
        itemsPurchaseAction,
        duplicatedItemsPurchaseAction,
        transferListFullPurchaseAction,
        currency,
        state) {

        if (repositories.Item.numItemsInCache(ItemPile.PURCHASED)) {
            return BuyPackResult.UNASSIGNED_ITEMS;
        }

        if (!pack.prices._collection[currency] || pack.prices._collection[currency].amount > services.User.getUser()[currency.toLowerCase()].amount) {
            return BuyPackResult.NOT_ENOUGH_CREDITS;
        }

        if (currency == GameCurrency.COINS) {
            state.coinsSpent += pack.prices._collection[currency].amount;
        }
        else {
            state.pointsSpent += pack.prices._collection[currency].amount;
        }

        const purchaseResponse = await toPromise(pack.purchase(currency));

        if (!purchaseResponse.success) return BuyPackResult.ERROR;

        state.packsOpened++;

        const unassignedItems = await getUnassignedItems()

        const handle = async (action, purchaseAction) => {
            let result = await action(unassignedItems, purchaseAction || transferListFullPurchaseAction, transferListFullPurchaseAction, state);
            if (result != HandleItemResult.SUCCESS) {
                return result;
            }
            await delay(314 * speedMultiplier, 681 * speedMultiplier);
            return result;
        }

        let handleActions = [
            [handleNonDuplicatePlayers, playersPurchaseAction],
            [handleNonDuplicateManagers, managersPurchaseAction],
            [handleNonDuplicateItems, itemsPurchaseAction],
            [handleDuplicatedPlayers, duplicatedPlayersPurchaseAction],
            [handleDuplicatedManagers, duplicatedManagersPurchaseAction],
            [handleDuplicatedItems, duplicatedItemsPurchaseAction],
            [handleMiscItems]
        ];

        let handleResult = HandleItemResult.SUCCESS;
        for (let item of handleActions) {
            const [handleAction, purchaseAction] = item;

            handleResult = await handle(handleAction, purchaseAction);
            if (handleResult !== HandleItemResult.SUCCESS) {
                break;
            }
        }

        await getUserCredits();

        switch (handleResult) {
            case HandleItemResult.SUCCESS: return BuyPackResult.SUCCESS;
            case HandleItemResult.TRANSFER_LIST_FULL: return BuyPackResult.TRANSFER_LIST_FULL;
            default: return BuyPackResult.ERROR;
        }
    }
}

function menu() {
    const container = document.createElement("div");
    addLabelWithToggle(container, "enabled", cfg.enabled, toggleState => {
        if (toggleState && confirm(localize("plugins.dangerous"))) {
            cfg.enabled = true;
        }
        else if (!toggleState) {
            cfg.enabled = false;
        }
        saveConfiguration();
    });
    return container;
}

plugin = {
    run: run,
    order: 100,
    settings: {
        name: 'packs-opener',
        title: 'plugins.packsOpener.settings.title',
        menu: menu
    }
};
/// #endif

export default plugin;