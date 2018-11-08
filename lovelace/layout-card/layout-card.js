class LayoutCard extends Polymer.Element {

  static get template() {
    return Polymer.html`
    <style>
    :host {
      padding: 4px 4px 0;
      display: block;
    }
    #columns {
      display: flex;
      flex-direction: row;
      justify-content: center;
    }
    .column {
      flex-basis: 0;
      flex-grow: 1;
      max-width: 500px;
      overflow-x: hidden;
    }
    .column > * {
      display: block;
      margin: 4px 4px 8px;
    }
    </style>
    <div id="columns"></div>
    `;
  }

  makeCard(config) {
    let tag = config.type;
    if(tag.startsWith("custom:"))
      tag = tag.substr(7);
    else
      tag = `hui-${tag}-card`;
    let card = document.createElement(tag);
    card.setConfig(config);
    return card;
  }

  setConfig(config) {
    this.config = config;

    this.colnum = 0;
    this.config.min_height = this.config.minheight || 5;
    this.config.column_width = this.config.column_width || 300;
    this.config.layout = this.config.layout || 'auto';

    this._cards = config.cards.map((c) => {
      if (typeof c === 'string') return c;
      let el = this.makeCard(c);
      if (this.hass) el.hass = this.hass;
      return el;
    });

    window.addEventListener('resize', () => this._updateColumns());
    window.addEventListener('hass-open-menu', () => setTimeout(() => this._updateColumns(), 10));
    window.addEventListener('hass-close-menu', () => setTimeout(() => this._updateColumns(), 10));
    setTimeout(() => this._updateColumns(), 10);
  }

  _updateColumns() {
    let numcols = 0;
    if (this.config.column_num) {
      numcols = this.config.column_num;
    } else {
      let colWidth = this.config.column_width || 300;
      numcols = Math.max(1,
        Math.floor(this.$.columns.clientWidth/this.config.column_width));
    }
    console.log(numcols);
    if(numcols != this.colnum) {
      this.colnum = numcols;
      this._build();
    }
  }

  _build() {
    const root = this.$.columns;
    while(root.lastChild) root.removeChild(root.lastChild);

    let cols = [];
    let colLen = [];
    for(let i = 0; i < this.colnum; i++) {
      cols.push([]);
      colLen.push(0);
    }

    let shortest = () => {
      let i = 0;
      for(let j = 0; j < colLen.length; j++) {
        if(colLen[j] < this.config.min_height) {
          i = j;
          break;
        }
        if(colLen[j] < colLen[i])
          i = j;
      }
      return i;
    }

    let i = 0;
    this._cards.forEach((c) => {
      let sz;
      if(typeof c !== 'string') {
        this.appendChild(c);
        sz = typeof c.getCardSize === 'function' ? c.getCardSize() : 1;
      }
      switch (this.config.layout) {
        case 'auto':
          if(typeof c === 'string') break;
          cols[shortest()].push(c);
          colLen[shortest()] += sz;
          break;
        case 'vertical':
          if(typeof c === 'string') {
            i += 1;
          } else {
            if (i >= this.colnum) i = 0;
            cols[i].push(c);
            colLen[i] += sz;
          }
          break;
        case 'horizontal':
          if(c instanceof String) {
            i += 1;
          } else {
            if (i >= this.colnum) i = 0;
            cols[i].push(c);
            colLen[i] += sz;
            i += 1;
          }
          break;
      }
    });

    cols = cols.filter(c => c.length > 0);
    let maxlen = 0;
    cols.forEach( c => {
      const cEl = document.createElement('div');
      cEl.classList.add('column');
      c.filter(e => typeof e !== 'string').forEach(e => cEl.appendChild(e));
      root.appendChild(cEl);
      if(c.length > maxlen) maxlen = c.length;
    });

    this.maxlen = maxlen;
  }

  set hass(hass) {
    this._cards.filter(c => typeof c !== 'string').forEach(c => c.hass = hass);
  }

  getCardSize() {
    return this.maxlen;
  }

}

customElements.define('layout-card', LayoutCard);