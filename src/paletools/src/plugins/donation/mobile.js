let plugin;

import { on } from "../../events";
import localize from "../../localization";
import messageBus from "../../services/messageBus";
/// #if process.env.DONATION_MOBILE
import { createElem, prepend, select } from "../../utils/dom";
import VERSION from "../../version";


function run() {

    const paypalImage = "data:image/gif;base64,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";
    const mercadoPagoImage = "data:image/gif;base64,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";

    const UTHomeHubView__generate = UTHomeHubView.prototype._generate;
    UTHomeHubView.prototype._generate = function _generate() {
        UTHomeHubView__generate.call(this);
        const tile = createElem("div", { className: "tile col-1-1" });
        
        const html = `
                            <header><h1 class="tileHeader">Paletools v${VERSION}</h1></header>
                            <div class="data-container" style="flex-direction:column">
                                <span class="itemsLabel" style="font-size:16px;line-height:initial">${localize("plugins.donation.message")}</span>
                                <div style="text-align: center"><a href="https://twitter.com/paleta" style="color:white">@paleta</a></div>
                                <div style="z-index:10000; text-align: center"><a href="#" id="donate-pp"><img src="${paypalImage}" /></a><a href="#" id="donate-ml"><img src="${mercadoPagoImage}" /></a></div>
                            </div>`;

        tile.innerHTML = html;
        prepend(select(".layout-hub", this.getRootElement()), tile);

        on(select("#donate-ml", tile), "pointerdown", () => {
            messageBus.publish("openurl", "https://ceneka.net/mp/d/paletaeaa");
        });

        on(select("#donate-pp", tile), "pointerdown", () => {
            messageBus.publish("openurl", "https://streamlabs.com/paleta_ar/tip");
        });

    }
}

plugin = {
    run: run,
    order: 2
};
/// #endif

export default plugin;