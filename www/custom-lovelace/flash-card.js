customElements.whenDefined('card-tools').then(() => {
class FlashCard extends cardTools.litElement() {

  static get properties() {
    return {
      card: {},
    };
  }

  setConfig(config) {
    cardTools.checkVersion(0.3);

    if(!config || !config.card) {
      throw new Error("Card config incorrect");
    }
    if(Array.isArray(config.card)) {
      throw new Error("It says 'card', not 'cardS'. Remove the dash.");
    }

    this.templated = [];
    this.attempts = 0;

    if (config.entities)
      config.card.entities = config.entities;

    this.card = cardTools.createCard(config.card);
    if(this._hass)
      this.card.hass = this._hass;

    if(this._config)
      this._cardMod();

    this._config = config;
  }

  render() {
    return cardTools.litHtml()`
    <div id="root">${this.card}</div>
    `;
  }

  firstUpdated() {
    this._cardMod();
  }

  _cardMod() {
    if(!this._config.flashState) return;

    let target = null;
    target = target || this.card.querySelector("ha-card");
    target = target || this.card.shadowRoot && this.card.shadowRoot.querySelector("ha-card");
    target = target || this.card.firstChild && this.card.firstChild.shadowRoot && this.card.firstChild.shadowRoot.querySelector("ha-card");
    target = target || this.card.shadowRoot && this.card.shadowRoot.querySelector("#root") && this.card.shadowRoot.querySelector("#root").firstElementChild && this.card.shadowRoot.querySelector("#root").firstElementChild.shadowRoot && this.card.shadowRoot.querySelector("#root").firstElementChild.shadowRoot.querySelector("ha-card");
    if(!target && !this.attempts) // Try twice
      setTimeout(() => this._cardMod(), 100);
    this.attempts++;
    target = target || this.card;

    for(var k in this._config.style) {
      if(cardTools.hasTemplate(this._config.style[k]))
        this.templated.push(k);
      if(this.card.style.setProperty)
        this.card.style.setProperty(k, '');
      if(target.style.setProperty)
        target.style.setProperty(k, cardTools.parseTemplate(this._config.style[k]));
    }
    this.target = target;
  }

  set hass(hass) {
    this._hass = hass;
    if(this.card) this.card.hass = hass;
    if(this.templated)
      this.templated.forEach((k) => {
        this.target.style.setProperty(k, cardTools.parseTemplate(this._config.style[k], ''));
      });
  }

  getCardSize() {
    if(this._config && this._config.report_size)
      return this._config.report_size;
    if(this.card)
      return typeof this.card.getCardSize === "function" ? this.card.getCardSize() : 1;
    return 1;
  }
}

customElements.define('flash-card', FlashCard);
});

window.setTimeout(() => {
  if(customElements.get('card-tools')) return;
  customElements.define('flash-card', class extends HTMLElement{
    setConfig() { throw new Error("Can't find card-tools. See https://github.com/thomasloven/lovelace-card-tools");}
  });
}, 2000);
