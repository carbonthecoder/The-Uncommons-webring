/**
 * The Uncommons Webring Embeddable Widget
 * Zero dependencies, shadow DOM isolated, Vercel-style aesthetics.
 */
(function () {
  class UncommonsRing extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      const site = this.getAttribute('site') || window.location.hostname;
      const theme = this.getAttribute('theme') || 'obsidian';
      const hubUrl = this.getAttribute('hub') || window.location.origin;

      const nextUrl = `${hubUrl}/?from=${encodeURIComponent(site)}&action=next`;
      const prevUrl = `${hubUrl}/?from=${encodeURIComponent(site)}&action=prev`;
      const randomUrl = `${hubUrl}/?from=${encodeURIComponent(site)}&action=random`;

      const styles = `
        :host {
          display: inline-block;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          line-height: 1;
          color: #d4d4d8;
        }

        .ring-container {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #09090b;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          user-select: none;
          transition: border-color 0.15s ease;
        }

        .ring-container:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        a {
          color: #a1a1aa;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          transition: color 0.15s ease;
        }

        a:hover {
          color: #ffffff;
        }

        .hub-link {
          color: #f4f4f5;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .divider {
          color: #3f3f46;
        }

        .icon {
          display: inline-block;
          width: 8px;
          height: 8px;
          border: 1px solid #71717a;
          border-radius: 50%;
        }
      `;

      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="ring-container">
          <a href="${prevUrl}" title="Previous Node" class="nav-btn">◄ Prev</a>
          <span class="divider">|</span>
          <a href="${hubUrl}" title="The Uncommons Webring Hub" class="hub-link">
            <span class="icon"></span>
            The Uncommons
          </a>
          <span class="divider">|</span>
          <a href="${nextUrl}" title="Next Node" class="nav-btn">Next ►</a>
        </div>
      `;
    }
  }

  if (!customElements.get('uncommons-ring')) {
    customElements.define('uncommons-ring', UncommonsRing);
  }
})();
