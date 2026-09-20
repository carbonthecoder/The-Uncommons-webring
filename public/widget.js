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
          gap: 12px;
          padding: 8px 16px;
          background: rgba(15, 15, 17, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          user-select: none;
          transition: all 0.3s ease;
        }

        .ring-container:hover {
          background: rgba(20, 20, 22, 0.85);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        a {
          color: #a1a1aa;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        a:hover {
          color: #ffffff;
        }

        .hub-link {
          color: #f4f4f5;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .hub-link:hover {
          color: #ffffff;
        }

        .divider {
          width: 1px;
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
        }

        .icon {
          display: inline-block;
          width: 8px;
          height: 8px;
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .hub-link:hover .icon {
          transform: scale(1.1);
          border-color: #ffffff;
        }
      `;

      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="ring-container">
          <a href="${prevUrl}" title="Previous Node" class="nav-btn">← Prev</a>
          <span class="divider"></span>
          <a href="${hubUrl}" title="The Uncommons Webring Hub" class="hub-link">
            <span class="icon"></span>
            The Uncommons
          </a>
          <span class="divider"></span>
          <a href="${nextUrl}" title="Next Node" class="nav-btn">Next →</a>
        </div>
      `;
    }
  }

  if (!customElements.get('uncommons-ring')) {
    customElements.define('uncommons-ring', UncommonsRing);
  }
})();
