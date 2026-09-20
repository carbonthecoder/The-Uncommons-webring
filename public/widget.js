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
      const hubUrl = this.getAttribute('hub') || 'https://the-uncommons.vercel.app';

      const nextUrl = `${hubUrl}/go?from=${encodeURIComponent(site)}&action=next`;
      const prevUrl = `${hubUrl}/go?from=${encodeURIComponent(site)}&action=prev`;
      const randomUrl = `${hubUrl}/go?from=${encodeURIComponent(site)}&action=random`;

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
          gap: 10px;
          padding: 6px 14px;
          background: #09090b;
          border: 1px solid rgba(52, 211, 153, 0.2);
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          user-select: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .ring-container:hover {
          border-color: rgba(52, 211, 153, 0.5);
          box-shadow: 0 4px 16px rgba(52, 211, 153, 0.1);
        }

        a {
          color: #a1a1aa;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s ease;
        }

        a:hover {
          color: #34d399;
        }

        .hub-link {
          color: #34d399;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .hub-link:hover {
          color: #10b981;
        }

        .divider {
          color: #3f3f46;
        }

        .icon {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #34d399;
          border-radius: 50%;
          box-shadow: 0 0 8px #34d399;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.6; box-shadow: 0 0 4px #34d399; }
          50% { opacity: 1; box-shadow: 0 0 10px #34d399; }
          100% { opacity: 0.6; box-shadow: 0 0 4px #34d399; }
        }
      `;

      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="ring-container">
          <a href="${prevUrl}" title="Previous Node" class="nav-btn">[prev]</a>
          <span class="divider"></span>
          <a href="${hubUrl}" title="The Uncommons Webring Hub" class="hub-link">
            <span class="icon"></span>
            [ the uncommons ]
          </a>
          <span class="divider"></span>
          <a href="${nextUrl}" title="Next Node" class="nav-btn">[next]</a>
        </div>
      `;
    }
  }

  if (!customElements.get('uncommons-ring')) {
    customElements.define('uncommons-ring', UncommonsRing);
  }
})();
